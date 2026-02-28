"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COOKIE_OPTIONS = void 0;
exports.signTokenForUser = signTokenForUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
function signTokenForUser(user) {
    return jsonwebtoken_1.default.sign({
        userId: String(user._id),
        email: user.email,
        name: user.name,
        image: user.image,
        onboardingCompleted: user.onboardingCompleted,
    }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
