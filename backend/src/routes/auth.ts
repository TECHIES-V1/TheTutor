import { Request, Response, Router } from "express";
import passport from "passport";
import { IUser } from "../models/User";
import { requireAuth } from "../middleware/auth";
import { CLEAR_COOKIE_OPTIONS, COOKIE_OPTIONS, signTokenForUser } from "../utils/auth";
import { getFrontendBaseUrl } from "../config/publicUrls";

const router = Router();
const FRONTEND_URL = getFrontendBaseUrl();

// GET /auth/google - initiate Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /auth/google/callback - OAuth callback, set JWT cookie, redirect to frontend
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/auth/signin?error=oauth_failed`,
  }),
  (req: Request, res: Response) => {
    const user = req.user as IUser | undefined;
    if (!user) {
      res.redirect(`${FRONTEND_URL}/auth/signin?error=oauth_user_missing`);
      return;
    }

    const token = signTokenForUser(user);
    res.cookie("token", token, COOKIE_OPTIONS);
    const onboardingCompleted = user.onboardingCompleted ? "1" : "0";
    res.redirect(`${FRONTEND_URL}/api/auth/callback?onboardingCompleted=${onboardingCompleted}&token=${encodeURIComponent(token)}&userId=${user._id}`);
  }
);

// GET /auth/me - return current user from JWT
router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json(req.jwtUser);
});

// POST /auth/logout - clear cookie
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", CLEAR_COOKIE_OPTIONS);
  res.json({ success: true });
});

export default router;
