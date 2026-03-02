"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePassport = configurePassport;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const User_1 = require("../models/User");
function configurePassport() {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value ?? "";
            const image = profile.photos?.[0]?.value ?? "";
            let user = await User_1.User.findOne({ googleId: profile.id });
            if (!user) {
                user = await User_1.User.create({
                    googleId: profile.id,
                    email,
                    name: profile.displayName,
                    image,
                });
            }
            return done(null, user);
        }
        catch (err) {
            return done(err, undefined);
        }
    }));
}
