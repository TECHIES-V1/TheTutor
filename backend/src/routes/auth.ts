import { Router, Request, Response } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { IUser } from "../models/User";
import { requireAuth } from "../middleware/auth";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function signToken(user: IUser): string {
  return jwt.sign(
    {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      image: user.image,
      onboardingCompleted: user.onboardingCompleted,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
}

// GET /auth/google — initiate Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /auth/google/callback — OAuth callback, set JWT cookie, redirect to frontend
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/auth/signin` }),
  (req: Request, res: Response) => {
    const user = req.user as IUser;
    const token = signToken(user);

    res.cookie("token", token, COOKIE_OPTIONS);
    res.redirect(`${process.env.FRONTEND_URL}/api/auth/callback`);
  }
);

// GET /auth/me — return current user from JWT
router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json(req.jwtUser);
});

// POST /auth/logout — clear cookie
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.json({ success: true });
});

export default router;
