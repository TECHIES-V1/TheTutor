import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  image: string;
  onboardingCompleted: boolean;
}

declare global {
  namespace Express {
    interface Request {
      jwtUser?: JwtPayload;
    }
  }
}

function decodeToken(token: string | undefined): JwtPayload | null {
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | undefined {
  // Cookie first, then Authorization: Bearer <token>
  return (
    req.cookies?.token ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "")
  );
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const payload = decodeToken(extractToken(req));
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.jwtUser = payload;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const payload = decodeToken(extractToken(req));
  if (payload) {
    req.jwtUser = payload;
  }
  next();
}
