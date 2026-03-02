"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("passport"));
const database_1 = require("./config/database");
const passport_2 = require("./config/passport");
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const chat_1 = __importDefault(require("./routes/chat"));
const course_1 = __importDefault(require("./routes/course"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 5000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
// ── Middleware ──────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// ── Passport (no sessions — JWT only) ──────────────────────────────────────
(0, passport_2.configurePassport)();
app.use(passport_1.default.initialize());
// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/auth", auth_1.default);
app.use("/user", user_1.default);
app.use("/chat", chat_1.default);
app.use("/course", course_1.default);
app.get("/health", (_req, res) => res.json({ status: "ok" }));
// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
(0, database_1.connectDatabase)()
    .then(async () => {
    try {
        await seedDemoCourses();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("⚠️ Demo course seed failed:", message);
    }
})
    .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
});
