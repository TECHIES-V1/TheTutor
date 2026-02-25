import { Router, Request, Response } from "express";
import { requireAuth, JwtPayload } from "../middleware/auth";
import { Course, ICourse } from "../models/Course";
import { Enrollment, IEnrollment } from "../models/Enrollment";
import { Certificate } from "../models/Certificate";
import { User } from "../models/User";
import { flattenLessons, getTotalLessonCount } from "../services/courseUtils";

const router = Router();

function mapDashboardCourse(
  course: ICourse,
  enrollment: IEnrollment | null,
  role: "owner" | "learner",
  hasCertificate: boolean
) {
  const lessons = flattenLessons(course);
  const lessonCount = lessons.length;
  const currentLessonTitle =
    enrollment?.currentLessonId
      ? lessons.find((item) => item.lesson.lessonId === enrollment.currentLessonId)?.lesson.title ?? null
      : null;

  return {
    id: String(course._id),
    title: course.title,
    description: course.description,
    topic: course.topic,
    level: course.level,
    ownerName: course.ownerName,
    visibility: course.visibility,
    role,
    lessonCount,
    progressPercent: enrollment?.progressPercent ?? 0,
    currentLessonId: enrollment?.currentLessonId ?? (lessons[0]?.lesson.lessonId ?? null),
    currentLessonTitle,
    status: enrollment?.status ?? "active",
    completed: enrollment?.status === "completed" || enrollment?.progressPercent === 100,
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

    const ownedCourses = await Course.find({ ownerId: userId }).sort({ updatedAt: -1 });
    const ownedCourseIds = ownedCourses.map((course) => course._id);

    const ownedEnrollments = await Enrollment.find({
      userId,
      courseId: { $in: ownedCourseIds },
    });
    const ownedEnrollmentByCourseId = new Map<string, IEnrollment>();
    for (const enrollment of ownedEnrollments) {
      ownedEnrollmentByCourseId.set(String(enrollment.courseId), enrollment);
    }

    const externalEnrollments = await Enrollment.find({
      userId,
      courseId: { $nin: ownedCourseIds },
    }).sort({ updatedAt: -1 });
    const externalCourseIds = externalEnrollments.map((enrollment) => enrollment.courseId);
    const externalCourses = externalCourseIds.length
      ? await Course.find({ _id: { $in: externalCourseIds } })
      : [];
    const externalCourseById = new Map<string, ICourse>();
    for (const course of externalCourses) {
      externalCourseById.set(String(course._id), course);
    }

    const certificates = await Certificate.find({ userId });
    const certificateCourseIds = new Set<string>(certificates.map((item) => String(item.courseId)));

    const ownedCards = ownedCourses.map((course) =>
      mapDashboardCourse(
        course,
        ownedEnrollmentByCourseId.get(String(course._id)) ?? null,
        "owner",
        certificateCourseIds.has(String(course._id))
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
          certificateCourseIds.has(String(course._id))
        );
      })
      .filter((item): item is NonNullable<typeof item> => !!item);

    const allEnrollments = [...ownedEnrollments, ...externalEnrollments];
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
        enrolledCourses: allEnrollments.length,
        completedCourses,
        hoursLearned,
        totalLessonsAcrossCourses: totalLessonSlots,
      },
      ownedCourses: ownedCards,
      enrolledCourses: enrolledCards,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

