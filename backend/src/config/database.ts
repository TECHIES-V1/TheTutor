import mongoose from "mongoose";
import { logger } from "./logger";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000; // exponential backoff: 1s, 2s, 4s

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined in environment variables");

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, {
        maxPoolSize: 20,
        minPoolSize: 2,
        socketTimeoutMS: 45_000,
        serverSelectionTimeoutMS: 10_000,
      });
      logger.info("MongoDB connected");
      return;
    } catch (err) {
      logger.warn({ err, attempt }, `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed`);
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((r) => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt - 1)));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
