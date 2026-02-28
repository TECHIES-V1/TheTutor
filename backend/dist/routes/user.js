"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
// PUT /user/complete-onboarding — mark course creation complete, issue updated JWT
router.put("/complete-onboarding", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const user = await User_1.User.findByIdAndUpdate(userId, { onboardingCompleted: true }, { new: true });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Reissue JWT with updated onboardingCompleted flag
        const token = jsonwebtoken_1.default.sign({
            userId: String(user._id),
            email: user.email,
            name: user.name,
            image: user.image,
            onboardingCompleted: user.onboardingCompleted,
        }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, COOKIE_OPTIONS);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// GET /user/profile — full user document
router.get("/profile", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const user = await User_1.User.findById(userId).select("-__v");
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
