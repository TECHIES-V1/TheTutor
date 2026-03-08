/**
 * Migration script: generates slugs for existing courses that don't have one.
 *
 * Usage:
 *   npx ts-node src/scripts/migrateSlugs.ts
 *
 * Requires MONGODB_URI in .env (or set as environment variable).
 */

import "dotenv/config";
import mongoose from "mongoose";
import { Course } from "../models/Course";
import { slugify } from "../services/slugUtils";

async function generateUniqueSlugLocal(title: string): Promise<string> {
  const base = slugify(title);
  if (!base) return `course-${Date.now()}`;

  let candidate = base;
  let suffix = 2;
  while (await Course.exists({ slug: candidate })) {
    candidate = `${base}-${suffix}`.slice(0, 60);
    suffix++;
  }
  return candidate;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Aborting.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const courses = await Course.find({ $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }] }).select(
    "_id title"
  );

  console.log(`Found ${courses.length} course(s) without a slug.`);

  let migrated = 0;
  for (const course of courses) {
    const slug = await generateUniqueSlugLocal(course.title);
    await Course.updateOne({ _id: course._id }, { $set: { slug } });
    console.log(`  [${course._id}] "${course.title}" -> ${slug}`);
    migrated++;
  }

  console.log(`\nDone. Migrated ${migrated} course(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
