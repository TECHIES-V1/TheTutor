"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
function signToken(user) {
    return jsonwebtoken_1.default.sign({
        userId: String(user._id),
        email: user.email,
        name: user.name,
        image: user.image,
        onboardingCompleted: user.onboardingCompleted,
    }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
// GET /auth/google — initiate Google OAuth
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"], session: false }));
// GET /auth/google/callback — OAuth callback, set JWT cookie, redirect to frontend
router.get("/google/callback", passport_1.default.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/auth/signin` }), (req, res) => {
    const user = req.user;
    const token = signToken(user);
    res.cookie("token", token, COOKIE_OPTIONS);
    res.redirect(`${process.env.FRONTEND_URL}/api/auth/callback`);
});
// GET /auth/me — return current user from JWT
router.get("/me", auth_1.requireAuth, (req, res) => {
    res.json(req.jwtUser);
});
// POST /auth/logout — clear cookie
router.post("/logout", (_req, res) => {
    res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
    res.json({ success: true });
});
exports.default = router;
