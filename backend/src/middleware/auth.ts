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

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
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
