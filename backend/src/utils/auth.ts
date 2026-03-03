import jwt from "jsonwebtoken";
import { IUser } from "../models/User";

function parseHostname(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return null;
  }
}

const isProduction = process.env.NODE_ENV === "production";
const frontendHost = parseHostname(process.env.FRONTEND_URL);
const backendHost = parseHostname(process.env.BACKEND_URL);
const isCrossSite = Boolean(frontendHost && backendHost && frontendHost !== backendHost);
const sameSite = isProduction && isCrossSite ? ("none" as const) : ("lax" as const);
const secure = isProduction;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite,
  secure,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite,
  secure,
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
