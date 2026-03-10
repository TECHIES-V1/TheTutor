import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import mongoose from "mongoose";
import http from "http";

import { connectDatabase, disconnectDatabase } from "./config/database";
import { configurePassport } from "./config/passport";
import { resumeOrphanedJobs } from "./services/course/jobRunner";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import chatRoutes from "./routes/chat";
import courseRoutes from "./routes/course";
import coursesRoutes from "./routes/courses";
import dashboardRoutes from "./routes/dashboard";
import ttsRoutes from "./routes/tts";
import { getFrontendBaseUrl } from "./config/publicUrls";
import { requestLogger } from "./middleware/requestLogger";
import { logger } from "./config/logger";

// ── Validate required environment variables on boot ─────────────────────────
const REQUIRED_ENV = ["JWT_SECRET", "MONGODB_URI", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    logger.fatal(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT ?? 5000;
const FRONTEND_URL = getFrontendBaseUrl();
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 120_000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Strip trailing slashes before comparing to handle misconfigured env vars
      const allowed = FRONTEND_URL.replace(/\/+$/, "");
      const req = (origin ?? "").replace(/\/+$/, "");
      if (!origin || req === allowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin "${origin}" not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);
app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());

// Request timeout — prevents hung connections from holding resources
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setTimeout(REQUEST_TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(408).json({ error: "Request timeout" });
    }
  });
  next();
});

app.use(requestLogger);

// ── Passport (no sessions — JWT only) ──────────────────────────────────────
configurePassport();
app.use(passport.initialize());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/chat", chatRoutes);
app.use("/course", courseRoutes);
app.use("/courses", coursesRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/tts", ttsRoutes);

app.get("/health", (_req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  res.status(dbState === 1 ? 200 : 503).json({
    status: dbState === 1 ? "ok" : "degraded",
    db: dbState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// Global error handler — catches unhandled errors from route handlers
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "[global] Unhandled error");
  if (!res.headersSent) {
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// ── Process-level error handlers ────────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "[process] Unhandled promise rejection");
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "[process] Uncaught exception");
  process.exit(1);
});

// ── Start ───────────────────────────────────────────────────────────────────
let server: http.Server;

connectDatabase()
  .then(async () => {
    server = app.listen(PORT, () => {
      logger.info(`Backend running on http://localhost:${PORT}`);
    });
    // Resume any generation jobs that were interrupted by a server restart
    await resumeOrphanedJobs();
  })
  .catch((err) => {
    logger.error({ err }, "MongoDB connection failed");
    process.exit(1);
  });

// ── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — shutting down gracefully`);
  if (server) {
    server.close(() => logger.info("HTTP server closed"));
  }
  try {
    await disconnectDatabase();
  } catch (err) {
    logger.error({ err }, "Error during DB disconnect");
  }
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
