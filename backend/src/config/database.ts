import mongoose from "mongoose";
import { logger } from "./logger";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined in environment variables");

  await mongoose.connect(uri, {
    maxPoolSize: 100,
    minPoolSize: 10,
    socketTimeoutMS: 45_000,
    serverSelectionTimeoutMS: 10_000,
  });
  logger.info("MongoDB connected");
}
