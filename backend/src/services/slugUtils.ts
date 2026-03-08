import { Course } from "../models/Course";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function generateUniqueSlug(title: string): Promise<string> {
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
