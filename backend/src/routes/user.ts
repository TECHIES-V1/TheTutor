import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { requireAuth, JwtPayload } from "../middleware/auth";
import { validateBody, userPreferencesSchema } from "../middleware/validate";
import { logger } from "../config/logger";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// PUT /user/complete-onboarding — mark course creation complete, issue updated JWT
router.put("/complete-onboarding", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const user = await User.findByIdAndUpdate(
      userId,
      { onboardingCompleted: true },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Reissue JWT with updated onboardingCompleted flag
    const token = jwt.sign(
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

    res.cookie("token", token, COOKIE_OPTIONS);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to complete onboarding");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /user/profile — full user document
router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const user = await User.findById(userId).select("-__v");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (err) {
    logger.error({ err }, "Failed to get user profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/preferences", requireAuth, validateBody(userPreferencesSchema), async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const themeRaw = req.body.theme as "light" | "dark";

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.preferences = {
      ...(user.preferences ?? {}),
      theme: themeRaw as "light" | "dark",
    };
    await user.save();

    res.json({
      success: true,
      preferences: user.preferences,
    });
  } catch (err) {
    logger.error({ err }, "Failed to update user preferences");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
