import jwt from "jsonwebtoken";
import { IUser } from "../models/User";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function signTokenForUser(user: IUser): string {
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

