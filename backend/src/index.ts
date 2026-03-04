import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

import { connectDatabase } from "./config/database";
import { configurePassport } from "./config/passport";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import chatRoutes from "./routes/chat";
import courseRoutes from "./routes/course";
import coursesRoutes from "./routes/courses";
import dashboardRoutes from "./routes/dashboard";
import { getFrontendBaseUrl } from "./config/publicUrls";

const app = express();
const PORT = process.env.PORT ?? 5000;
const FRONTEND_URL = getFrontendBaseUrl();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

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

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ───────────────────────────────────────────────────────────────────
connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
