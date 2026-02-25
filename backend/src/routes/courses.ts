import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import { requireAuth, JwtPayload } from "../middleware/auth";
import { Course, ICourse } from "../models/Course";
import { Enrollment, IEnrollment } from "../models/Enrollment";
import { QuizAttempt } from "../models/QuizAttempt";
import { Certificate } from "../models/Certificate";
import { User } from "../models/User";
import { generateCourse } from "../services/generationAdapter";
import { generateLessonAssistantReply } from "../services/assistantService";
import { gradeQuiz, PASS_THRESHOLD } from "../services/gradingService";
import { generateCertificateFile } from "../services/certificateService";
import {
  flattenLessons,
  findLessonById,
  getNextLessonId,
  getTotalLessonCount,
  computeProgressPercent,
} from "../services/courseUtils";
import { COOKIE_OPTIONS, signTokenForUser } from "../utils/auth";
import { CourseLevel, OnboardingPayload } from "../types/courseContract";

const router = Router();

function toCourseId(param: string): Types.ObjectId | null {
  if (!Types.ObjectId.isValid(param)) return null;
  return new Types.ObjectId(param);
}

function normalizeLevel(input: unknown): CourseLevel {
  const raw = String(input ?? "").trim().toLowerCase();
  if (raw === "beginner" || raw === "intermediate" || raw === "advanced") {
    return raw;
  }
  return "beginner";
}

function parseOnboarding(payload: unknown): OnboardingPayload {
  const data = (payload ?? {}) as Partial<OnboardingPayload>;

  const topic = String(data.topic ?? "").trim() || "General Learning";
  const goal = String(data.goal ?? "").trim() || "Build practical skills";
  const hoursRaw = Number(data.hoursPerWeek ?? 4);
  const hoursPerWeek = Number.isFinite(hoursRaw) ? Math.max(1, Math.min(40, Math.round(hoursRaw))) : 4;
  const level = normalizeLevel(data.level);

  return {
    topic,
    level,
    hoursPerWeek,
    goal,
  };
}

async function ensureEnrollment(userId: string, course: ICourse): Promise<IEnrollment> {
  const firstLesson = flattenLessons(course)[0]?.lesson.lessonId ?? "";
  const existing = await Enrollment.findOne({
    userId: userId,
    courseId: course._id,
  });

  if (existing) {
    if (!existing.currentLessonId && firstLesson) {
      existing.currentLessonId = firstLesson;
      await existing.save();
    }
    return existing;
  }

  return Enrollment.create({
    userId,
    courseId: course._id,
    status: "active",
    progressPercent: 0,
    currentLessonId: firstLesson,
    completedLessonIds: [],
  });
}

async function getAccessState(userId: string, course: ICourse): Promise<{ isOwner: boolean; enrollment: IEnrollment | null }> {
  const isOwner = String(course.ownerId) === userId;
  const enrollment = await Enrollment.findOne({ userId, courseId: course._id });
  return { isOwner, enrollment };
}

function buildCourseSummary(course: ICourse, enrollment: IEnrollment | null) {
  const totalLessons = getTotalLessonCount(course);
  const completedCount = enrollment?.completedLessonIds.length ?? 0;

  return {
    id: String(course._id),
    title: course.title,
    description: course.description,
    topic: course.topic,
    level: course.level,
    goal: course.goal,
    ownerName: course.ownerName,
    visibility: course.visibility,
    accessModel: course.accessModel,
    moduleCount: course.curriculum.length,
    lessonCount: totalLessons,
    enrollment: enrollment
      ? {
          status: enrollment.status,
          progressPercent: enrollment.progressPercent,
          currentLessonId: enrollment.currentLessonId,
          completedLessonCount: completedCount,
        }
      : null,
  };
}

router.post("/bootstrap", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const existingCourse = await Course.findOne({ ownerId: userId }).sort({ createdAt: -1 });
    if (existingCourse) {
      const enrollment = await ensureEnrollment(userId, existingCourse);

      if (!user.onboardingCompleted) {
        user.onboardingCompleted = true;
        await user.save();
        res.cookie("token", signTokenForUser(user), COOKIE_OPTIONS);
      }

      res.json({
        created: false,
        course: buildCourseSummary(existingCourse, enrollment),
      });
      return;
    }

    const onboarding = parseOnboarding(req.body?.onboarding);
    const generated = await generateCourse({
      onboarding,
      userName: user.name,
    });

    const course = await Course.create({
      ownerId: user._id,
      ownerName: user.name,
      title: generated.course.title,
      description: generated.course.description,
      topic: generated.course.topic,
      level: generated.course.level,
      goal: generated.course.goal,
      visibility: "draft",
      accessModel: "free_hackathon",
      generationStatus: "ready",
      createdBy: generated.source,
      curriculum: generated.course.curriculum,
    });

    const enrollment = await ensureEnrollment(userId, course);

    if (!user.onboardingCompleted) {
      user.onboardingCompleted = true;
      await user.save();
      res.cookie("token", signTokenForUser(user), COOKIE_OPTIONS);
    }

    res.status(201).json({
      created: true,
      course: buildCourseSummary(course, enrollment),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/explore", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;

    const courses = await Course.find({
      ownerId: { $ne: userId },
      visibility: "published",
      generationStatus: "ready",
    }).sort({ createdAt: -1 });

    const courseIds = courses.map((course) => course._id);
    const enrollments = await Enrollment.find({
      userId,
      courseId: { $in: courseIds },
    });

    const enrollmentByCourseId = new Map<string, IEnrollment>();
    for (const enrollment of enrollments) {
      enrollmentByCourseId.set(String(enrollment.courseId), enrollment);
    }

    const payload = courses.map((course) => {
      const enrollment = enrollmentByCourseId.get(String(course._id)) ?? null;
      return buildCourseSummary(course, enrollment);
    });

    res.json({ courses: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:courseId/preview", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const courseId = toCourseId(req.params.courseId);
    if (!courseId) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const { isOwner, enrollment } = await getAccessState(userId, course);
    const canView = isOwner || course.visibility === "published";

    if (!canView) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const outline = [...course.curriculum]
      .sort((a, b) => a.order - b.order)
      .map((module) => ({
        moduleId: module.moduleId,
        title: module.title,
        order: module.order,
        lessons: [...module.lessons]
          .sort((a, b) => a.order - b.order)
          .map((lesson) => ({
            lessonId: lesson.lessonId,
            title: lesson.title,
            order: lesson.order,
            summary: lesson.summary,
          })),
      }));

    res.json({
      course: buildCourseSummary(course, enrollment),
      curriculumOutline: outline,
      access: {
        isOwner,
        isEnrolled: !!enrollment,
        canEnroll: !isOwner && !enrollment && course.visibility === "published",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:courseId/enroll", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const courseId = toCourseId(req.params.courseId);
    if (!courseId) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const isOwner = String(course.ownerId) === userId;
    if (!isOwner && course.visibility !== "published") {
      res.status(403).json({ error: "Course is not published" });
      return;
    }

    if (course.generationStatus !== "ready") {
      res.status(409).json({ error: "Course is still generating" });
      return;
    }

    const enrollment = await ensureEnrollment(userId, course);

    res.json({
      enrollment: {
        courseId: String(course._id),
        status: enrollment.status,
        progressPercent: enrollment.progressPercent,
        currentLessonId: enrollment.currentLessonId,
        completedLessonIds: enrollment.completedLessonIds,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:courseId/lessons/:lessonId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const courseId = toCourseId(req.params.courseId);
    if (!courseId) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const { isOwner, enrollment } = await getAccessState(userId, course);
    if (!isOwner && !enrollment) {
      res.status(403).json({ error: "Enrollment required" });
      return;
    }

    const lessonRecord = findLessonById(course, req.params.lessonId);
    if (!lessonRecord) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }

    const flattened = flattenLessons(course);
    const lessonIndex = flattened.findIndex((item) => item.lesson.lessonId === req.params.lessonId);
    const previousLessonId = lessonIndex > 0 ? flattened[lessonIndex - 1].lesson.lessonId : null;
    const nextLessonId = lessonIndex >= 0 && lessonIndex + 1 < flattened.length ? flattened[lessonIndex + 1].lesson.lessonId : null;

    res.json({
      course: {
        id: String(course._id),
        title: course.title,
        description: course.description,
      },
      lesson: {
        lessonId: lessonRecord.lesson.lessonId,
        title: lessonRecord.lesson.title,
        summary: lessonRecord.lesson.summary,
        videoUrl: lessonRecord.lesson.videoUrl,
        contentMarkdown: lessonRecord.lesson.contentMarkdown,
        quiz: lessonRecord.lesson.quiz.map((question) => ({
          questionId: question.questionId,
          prompt: question.prompt,
        })),
      },
      navigation: {
        previousLessonId,
        nextLessonId,
        isFinalLesson: !nextLessonId,
      },
      progress: enrollment
        ? {
            status: enrollment.status,
            progressPercent: enrollment.progressPercent,
            completedLessonIds: enrollment.completedLessonIds,
            currentLessonId: enrollment.currentLessonId,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:courseId/lessons/:lessonId/assistant", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const courseId = toCourseId(req.params.courseId);
    if (!courseId) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const { isOwner, enrollment } = await getAccessState(userId, course);
    if (!isOwner && !enrollment) {
      res.status(403).json({ error: "Enrollment required" });
      return;
    }

    const lessonRecord = findLessonById(course, req.params.lessonId);
    if (!lessonRecord) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }

    const question = String(req.body?.question ?? "");
    const answer = generateLessonAssistantReply(lessonRecord.lesson, question);
    res.json(answer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:courseId/lessons/:lessonId/quiz-attempts", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const courseId = toCourseId(req.params.courseId);
    if (!courseId) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const { isOwner, enrollment } = await getAccessState(userId, course);
    if (!isOwner && !enrollment) {
      res.status(403).json({ error: "Enrollment required" });
      return;
    }

    const lessonRecord = findLessonById(course, req.params.lessonId);
    if (!lessonRecord) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }

    const answers = Array.isArray(req.body?.answers)
      ? (req.body.answers as Array<{ questionId?: unknown; response?: unknown }>)
      : [];
    const parsedAnswers = answers
      .map((entry) => ({
        questionId: String(entry?.questionId ?? ""),
        response: String(entry?.response ?? ""),
      }))
      .filter((entry) => entry.questionId.length > 0);

    const grade = gradeQuiz(lessonRecord.lesson.quiz, parsedAnswers);
    const previousAttempts = await QuizAttempt.countDocuments({
      userId,
      courseId: course._id,
      lessonId: lessonRecord.lesson.lessonId,
    });
    const attemptNumber = previousAttempts + 1;

    const attempt = await QuizAttempt.create({
      userId,
      courseId: course._id,
      lessonId: lessonRecord.lesson.lessonId,
      attemptNumber,
      answers: parsedAnswers,
      score: grade.score,
      passed: grade.passed,
      feedback: grade.feedback,
    });

    let enrollmentRecord = enrollment;
    if (!enrollmentRecord) {
      enrollmentRecord = await ensureEnrollment(userId, course);
    }

    let nextLessonId: string | null = getNextLessonId(course, lessonRecord.lesson.lessonId);
    let lessonCompleted = false;
    let courseReadyToComplete = false;

    if (grade.passed) {
      lessonCompleted = true;
      if (!enrollmentRecord.completedLessonIds.includes(lessonRecord.lesson.lessonId)) {
        enrollmentRecord.completedLessonIds.push(lessonRecord.lesson.lessonId);
      }

      const totalLessons = getTotalLessonCount(course);
      const completedCount = enrollmentRecord.completedLessonIds.length;
      enrollmentRecord.progressPercent = computeProgressPercent(completedCount, totalLessons);
      enrollmentRecord.currentLessonId = nextLessonId ?? lessonRecord.lesson.lessonId;

      if (!nextLessonId) {
        courseReadyToComplete = completedCount >= totalLessons;
      }

      await enrollmentRecord.save();
    }

    res.json({
      attemptId: String(attempt._id),
      attemptNumber,
      score: grade.score,
      passThreshold: PASS_THRESHOLD,
      passed: grade.passed,
      feedback: grade.feedback,
      lessonCompleted,
      nextLessonId,
      courseReadyToComplete,
      progressPercent: enrollmentRecord.progressPercent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:courseId/complete", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const courseId = toCourseId(req.params.courseId);
    if (!courseId) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const { isOwner, enrollment } = await getAccessState(userId, course);
    if (!isOwner && !enrollment) {
      res.status(403).json({ error: "Enrollment required" });
      return;
    }

    const enrollmentRecord = enrollment ?? (await ensureEnrollment(userId, course));
    const totalLessons = getTotalLessonCount(course);
    if (enrollmentRecord.completedLessonIds.length < totalLessons) {
      res.status(400).json({ error: "Complete all lessons before finishing the course" });
      return;
    }

    enrollmentRecord.status = "completed";
    enrollmentRecord.progressPercent = 100;
    await enrollmentRecord.save();

    let certificate = await Certificate.findOne({
      userId,
      courseId: course._id,
    });

    if (!certificate) {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const generated = await generateCertificateFile(user, course);
      certificate = await Certificate.create({
        userId,
        courseId: course._id,
        certificateNumber: generated.certificateNumber,
        issuedAt: generated.issuedAt,
        pdfPath: generated.pdfPath,
        fileName: generated.fileName,
      });
    }

    res.json({
      completedAt: enrollmentRecord.updatedAt,
      certificate: {
        id: String(certificate._id),
        certificateNumber: certificate.certificateNumber,
        issuedAt: certificate.issuedAt,
        fileName: certificate.fileName,
        downloadUrl: `/courses/${course._id}/certificate/download`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:courseId/certificate", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const courseId = toCourseId(req.params.courseId);
    if (!courseId) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const { isOwner, enrollment } = await getAccessState(userId, course);
    if (!isOwner && !enrollment) {
      res.status(403).json({ error: "Enrollment required" });
      return;
    }

    const certificate = await Certificate.findOne({ userId, courseId: course._id });
    if (!certificate) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    res.json({
      certificate: {
        id: String(certificate._id),
        certificateNumber: certificate.certificateNumber,
        issuedAt: certificate.issuedAt,
        fileName: certificate.fileName,
        downloadUrl: `/courses/${course._id}/certificate/download`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:courseId/certificate/download", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const courseId = toCourseId(req.params.courseId);
    if (!courseId) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const { isOwner, enrollment } = await getAccessState(userId, course);
    if (!isOwner && !enrollment) {
      res.status(403).json({ error: "Enrollment required" });
      return;
    }

    const certificate = await Certificate.findOne({ userId, courseId: course._id });
    if (!certificate) {
      res.status(404).json({ error: "Certificate not found" });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${certificate.fileName}"`);
    res.sendFile(certificate.pdfPath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:courseId/publish", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const courseId = toCourseId(req.params.courseId);
    if (!courseId) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    if (String(course.ownerId) !== userId) {
      res.status(403).json({ error: "Only owner can publish this course" });
      return;
    }

    const desired = String(req.body?.visibility ?? "");
    if (desired !== "draft" && desired !== "published") {
      res.status(400).json({ error: "Invalid visibility value" });
      return;
    }

    course.visibility = desired;
    await course.save();

    const enrollment = await Enrollment.findOne({ userId, courseId: course._id });
    res.json({
      course: buildCourseSummary(course, enrollment),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/mine/list", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const courses = await Course.find({ ownerId: userId }).sort({ updatedAt: -1 });

    const courseIds = courses.map((course) => course._id);
    const enrollments = await Enrollment.find({ userId, courseId: { $in: courseIds } });
    const enrollmentByCourseId = new Map<string, IEnrollment>();
    for (const enrollment of enrollments) {
      enrollmentByCourseId.set(String(enrollment.courseId), enrollment);
    }

    res.json({
      courses: courses.map((course) => buildCourseSummary(course, enrollmentByCourseId.get(String(course._id)) ?? null)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
