"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
function requireAuth(req, res, next) {
    // Mock user for testing without a valid token
    req.jwtUser = {
        userId: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        name: "Test User",
        image: "",
        onboardingCompleted: false
    };
    next();
}
