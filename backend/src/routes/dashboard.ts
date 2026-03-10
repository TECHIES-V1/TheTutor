import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import { requireAuth, JwtPayload } from "../middleware/auth";
import { Course, ICourse } from "../models/Course";
import { Enrollment, IEnrollment } from "../models/Enrollment";
import { Certificate } from "../models/Certificate";
import { User } from "../models/User";
import { flattenLessons, getTotalLessonCount } from "../services/courseUtils";
import { logger } from "../config/logger";

const router = Router();

function readCourseField<T = unknown>(course: ICourse, path: string): T | undefined {
  const doc = course as unknown as {
    get?: (field: string) => unknown;
    [key: string]: unknown;
  };

  if (typeof doc.get === "function") {
    const value = doc.get(path);
    if (value !== undefined) return value as T;
  }

  return doc[path] as T | undefined;
}

function getCourseOwnerId(course: ICourse): string | null {
  const ownerId = readCourseField(course, "ownerId");
  if (ownerId) return String(ownerId);

  const userId = readCourseField(course, "userId");
  if (userId) return String(userId);

  return null;
}

function getCourseVisibility(course: ICourse): "draft" | "published" {
  const raw = readCourseField(course, "visibility");
  return raw === "published" ? "published" : "draft";
}

async function buildOwnerNameMap(courses: ICourse[]): Promise<Map<string, string>> {
  const ownerIdStrings = Array.from(
    new Set(
      courses
        .map((course) => getCourseOwnerId(course))
        .filter((id): id is string => typeof id === "string" && Types.ObjectId.isValid(id))
    )
  );
  const ownerIds = ownerIdStrings.map((id) => new Types.ObjectId(id));

  if (ownerIds.length === 0) {
    return new Map();
  }

  const owners = await User.find({ _id: { $in: ownerIds } }).select("_id name");
  const result = new Map<string, string>();
  for (const owner of owners) {
    result.set(String(owner._id), owner.name);
  }
  return result;
}

function mapDashboardCourse(
  course: ICourse,
  enrollment: IEnrollment | null,
  role: "owner" | "learner",
  hasCertificate: boolean,
  ownerFallbackName: string
) {
  const lessons = flattenLessons(course);
  const lessonCount = lessons.length;
  const ownerId = getCourseOwnerId(course);
  const ownerName = String(readCourseField(course, "ownerName") ?? ownerFallbackName);
  const sourceRefsRaw = readCourseField(course, "sourceReferences");
  const sourceAttribution = Array.isArray(sourceRefsRaw)
    ? sourceRefsRaw
        .map((ref: any) => ({
          title: String(ref?.title ?? "").trim(),
          authors: Array.isArray(ref?.authors)
            ? ref.authors.map((author: unknown) => String(author)).filter(Boolean)
            : [],
          source: String(ref?.source ?? "").trim(),
        }))
        .filter((ref: { title: string }) => ref.title.length > 0)
    : [];
  const currentLessonTitle =
    enrollment?.currentLessonId
      ? lessons.find((item) => item.lesson.lessonId === enrollment.currentLessonId)?.lesson.title ?? null
      : null;

  return {
    id: String(course._id),
    slug: String((course as any).slug ?? ""),
    title: course.title,
    description: course.description,
    topic: String(
      readCourseField(course, "topic") ??
        readCourseField(course, "subject") ??
        ""
    ),
    level: course.level,
    ownerName,
    author: {
      id: ownerId,
      name: ownerName,
    },
    sourceAttribution,
    visibility: getCourseVisibility(course),
    role,
    lessonCount,
    progressPercent: enrollment?.progressPercent ?? 0,
    currentLessonId: enrollment?.currentLessonId ?? (lessons[0]?.lesson.lessonId ?? null),
    currentLessonTitle,
    status: enrollment?.status ?? "active",
    completed: enrollment?.status === "completed" || enrollment?.progressPercent === 100,
    viewCount: (course as any).viewCount ?? 0,
    enrollmentCount: (course as any).enrollmentCount ?? 0,
    certificateAvailable: hasCertificate,
    updatedAt: enrollment?.updatedAt ?? course.updatedAt,
  };
}

router.get("/overview", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
    const ownerMatchFilters: Array<Record<string, unknown>> = [{ ownerId: userId }, { userId }];
    if (userObjectId) {
      ownerMatchFilters.push({ ownerId: userObjectId }, { userId: userObjectId });
    }

    const courseProjection = "title slug description topic subject level goal ownerId ownerName userId visibility generationStatus accessModel sourceReferences curriculum viewCount enrollmentCount updatedAt";

    // Run independent queries in parallel to eliminate N+1 waterfall
    const [ownedCourses, allEnrollments, certificates] = await Promise.all([
      Course.find({ $or: ownerMatchFilters }).select(courseProjection).sort({ updatedAt: -1 }),
      Enrollment.find({ userId }),
      Certificate.find({ userId }).select("courseId"),
    ]);

    const ownedCourseIds = new Set(ownedCourses.map((c) => String(c._id)));
    const certificateCourseIds = new Set<string>(certificates.map((item) => String(item.courseId)));

    // Split enrollments into owned vs external client-side
    const ownedEnrollmentByCourseId = new Map<string, IEnrollment>();
    const externalEnrollments: IEnrollment[] = [];
    for (const enrollment of allEnrollments) {
      const courseIdStr = String(enrollment.courseId);
      if (ownedCourseIds.has(courseIdStr)) {
        ownedEnrollmentByCourseId.set(courseIdStr, enrollment);
      } else {
        externalEnrollments.push(enrollment);
      }
    }

    // Batch-fetch external courses in one query
    const externalCourseIds = externalEnrollments.map((e) => e.courseId);
    const externalCourses = externalCourseIds.length
      ? await Course.find({ _id: { $in: externalCourseIds } }).select(courseProjection)
      : [];
    const externalCourseById = new Map<string, ICourse>();
    for (const course of externalCourses) {
      externalCourseById.set(String(course._id), course);
    }

    const ownerNameById = await buildOwnerNameMap([...ownedCourses, ...externalCourses]);

    const ownedCards = ownedCourses.map((course) =>
      mapDashboardCourse(
        course,
        ownedEnrollmentByCourseId.get(String(course._id)) ?? null,
        "owner",
        certificateCourseIds.has(String(course._id)),
        ownerNameById.get(getCourseOwnerId(course) ?? "") ?? user.name
      )
    );

    const enrolledCards = externalEnrollments
      .map((enrollment) => {
        const course = externalCourseById.get(String(enrollment.courseId));
        if (!course) return null;
        return mapDashboardCourse(
          course,
          enrollment,
          "learner",
          certificateCourseIds.has(String(course._id)),
          ownerNameById.get(getCourseOwnerId(course) ?? "") ?? user.name
        );
      })
      .filter((item): item is NonNullable<typeof item> => !!item);

    const completedCourses = allEnrollments.filter((enrollment) => enrollment.status === "completed").length;

    let completedLessons = 0;
    for (const enrollment of allEnrollments) {
      completedLessons += enrollment.completedLessonIds.length;
    }

    const hoursLearned = Number((completedLessons * 1.5).toFixed(1));
    const totalLessonSlots =
      ownedCourses.reduce((sum, course) => sum + getTotalLessonCount(course), 0) +
      externalCourses.reduce((sum, course) => sum + getTotalLessonCount(course), 0);

    res.json({
      greetingName: user.name,
      stats: {
        ownedCourses: ownedCards.length,
        enrolledCourses: enrolledCards.length,
        completedCourses,
        hoursLearned,
        totalLessonsAcrossCourses: totalLessonSlots,
      },
      ownedCourses: ownedCards,
      enrolledCourses: enrolledCards,
    });
  } catch (err) {
    logger.error({ err }, "Failed to get dashboard overview");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
