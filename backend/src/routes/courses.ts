import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import { requireAuth, optionalAuth, JwtPayload } from "../middleware/auth";
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

type NormalizedCourseOutline = Array<{
  moduleId: string;
  title: string;
  order: number;
  moduleQuiz?: {
    quizId: string;
    title: string;
    questionCount: number;
  } | null;
  lessons: Array<{
    lessonId: string;
    title: string;
    order: number;
    summary: string;
  }>;
}>;

function toCourseId(param: string): Types.ObjectId | null {
  if (!Types.ObjectId.isValid(param)) return null;
  return new Types.ObjectId(param);
}

function toObjectIdSafe(value: string): Types.ObjectId | null {
  if (!Types.ObjectId.isValid(value)) return null;
  return new Types.ObjectId(value);
}

function normalizeLevel(input: unknown): CourseLevel {
  const raw = String(input ?? "").trim().toLowerCase();
  if (raw === "beginner" || raw === "intermediate" || raw === "advanced") {
    return raw;
  }
  return "beginner";
}

function normalizePositiveOrder(value: unknown, fallback: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return num >= 1 ? num : num + 1;
}

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

function getCourseVisibility(course: ICourse): string {
  const visibility = readCourseField(course, "visibility");
  return typeof visibility === "string" ? visibility : "draft";
}

function getRequesterUserId(req: Request): string | null {
  return req.jwtUser?.userId ?? null;
}

function getCourseGenerationStatus(course: ICourse): string {
  const generationStatus = readCourseField(course, "generationStatus");
  return typeof generationStatus === "string" ? generationStatus : "";
}

function isCourseReadyForLearners(course: ICourse): boolean {
  const generationStatus = getCourseGenerationStatus(course);
  if (generationStatus) {
    return generationStatus === "ready";
  }

  const legacyStatus = String(readCourseField(course, "status") ?? "").toLowerCase();
  return legacyStatus !== "generating" && legacyStatus !== "archived";
}

function buildNormalizedOutline(course: ICourse): NormalizedCourseOutline {
  const modernCurriculum = readCourseField(course, "curriculum");
  if (Array.isArray(modernCurriculum)) {
    return modernCurriculum.map((module: any, moduleIndex: number) => ({
      moduleId: String(module.moduleId ?? `module-${moduleIndex + 1}`),
      title: String(module.title ?? `Module ${moduleIndex + 1}`),
      order: normalizePositiveOrder(module.order, moduleIndex + 1),
      moduleQuiz: module.moduleQuiz
        ? {
            quizId: String(module.moduleQuiz.quizId ?? `module-quiz-${moduleIndex + 1}`),
            title: String(module.moduleQuiz.title ?? `Module ${moduleIndex + 1} Checkpoint`),
            questionCount: Array.isArray(module.moduleQuiz.questions)
              ? module.moduleQuiz.questions.length
              : 0,
          }
        : null,
      lessons: Array.isArray(module.lessons)
        ? module.lessons.map((lesson: any, lessonIndex: number) => ({
            lessonId: String(lesson.lessonId ?? `lesson-${moduleIndex + 1}-${lessonIndex + 1}`),
            title: String(lesson.title ?? `Lesson ${lessonIndex + 1}`),
            order: normalizePositiveOrder(lesson.order, lessonIndex + 1),
            summary: String(lesson.summary ?? ""),
          }))
        : [],
    }));
  }

  const legacyModules = readCourseField(course, "modules");
  if (Array.isArray(legacyModules)) {
    return legacyModules.map((module: any, moduleIndex: number) => ({
      moduleId: String(module.id ?? `module-${moduleIndex + 1}`),
      title: String(module.title ?? `Module ${moduleIndex + 1}`),
      order: normalizePositiveOrder(module.order, moduleIndex + 1),
      moduleQuiz: module.moduleQuiz
        ? {
            quizId: String(module.moduleQuiz.quizId ?? `module-quiz-${moduleIndex + 1}`),
            title: String(module.moduleQuiz.title ?? `Module ${moduleIndex + 1} Checkpoint`),
            questionCount: Array.isArray(module.moduleQuiz.questions)
              ? module.moduleQuiz.questions.length
              : 0,
          }
        : null,
      lessons: Array.isArray(module.lessons)
        ? module.lessons.map((lesson: any, lessonIndex: number) => ({
            lessonId: String(lesson.id ?? `lesson-${moduleIndex + 1}-${lessonIndex + 1}`),
            title: String(lesson.title ?? `Lesson ${lessonIndex + 1}`),
            order: normalizePositiveOrder(lesson.order, lessonIndex + 1),
            summary: String(lesson.summary ?? lesson.description ?? ""),
          }))
        : [],
    }));
  }

  return [];
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
  const ownerNameById = new Map<string, string>();
  for (const owner of owners) {
    ownerNameById.set(String(owner._id), owner.name);
  }
  return ownerNameById;
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
  const outline = buildNormalizedOutline(course);
  const firstLesson = outline[0]?.lessons[0]?.lessonId ?? "";
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
  const ownerId = getCourseOwnerId(course);
  const isOwner = ownerId === userId;
  const enrollment = await Enrollment.findOne({ userId, courseId: course._id });
  return { isOwner, enrollment };
}

function buildCourseSummary(
  course: ICourse,
  enrollment: IEnrollment | null,
  ownerNameFallback = ""
) {
  const outline = buildNormalizedOutline(course);
  const totalLessons = outline.reduce((sum, module) => sum + module.lessons.length, 0);
  const completedCount = enrollment?.completedLessonIds.length ?? 0;
  const ownerId = getCourseOwnerId(course);
  const ownerName = String(readCourseField(course, "ownerName") ?? ownerNameFallback);
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

  return {
    id: String(course._id),
    title: course.title,
    description: course.description,
    topic: String(readCourseField(course, "topic") ?? readCourseField(course, "subject") ?? ""),
    level: course.level,
    goal: String(readCourseField(course, "goal") ?? ""),
    ownerName,
    author: {
      id: ownerId,
      name: ownerName,
    },
    visibility: getCourseVisibility(course),
    accessModel: String(readCourseField(course, "accessModel") ?? "free_hackathon"),
    moduleCount: outline.length,
    lessonCount: totalLessons,
    sourceAttribution,
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

    const userObjectId = toObjectIdSafe(userId);
    const ownerMatchFilters: Array<Record<string, unknown>> = [{ ownerId: userId }, { userId }];
    if (userObjectId) {
      ownerMatchFilters.push({ ownerId: userObjectId }, { userId: userObjectId });
    }

    const existingCourse = await Course.findOne({
      $or: ownerMatchFilters,
    }).sort({ createdAt: -1 });
    if (existingCourse) {
      const enrollment = await ensureEnrollment(userId, existingCourse);

      if (!user.onboardingCompleted) {
        user.onboardingCompleted = true;
        await user.save();
        res.cookie("token", signTokenForUser(user), COOKIE_OPTIONS);
      }

      res.json({
        created: false,
        course: buildCourseSummary(existingCourse, enrollment, user.name),
      });
      return;
    }

    const onboarding = parseOnboarding(req.body?.onboarding);
    const generated = await generateCourse({
      onboarding,
      userName: user.name,
    });

    const course = await Course.create({
      userId: user._id,
      ownerId: user._id,
      ownerName: user.name,
      conversationId: undefined,
      title: generated.course.title,
      description: generated.course.description,
      subject: generated.course.topic,
      topic: generated.course.topic,
      level: generated.course.level,
      goal: generated.course.goal,
      status: "active",
      modules: [],
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
      course: buildCourseSummary(course, enrollment, user.name),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/explore", optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = getRequesterUserId(req);

    const allCourses = await Course.find({}).sort({ createdAt: -1 });
    const ownerNameById = await buildOwnerNameMap(allCourses);
    const courses = allCourses.filter((course) => {
      return getCourseVisibility(course) === "published" && isCourseReadyForLearners(course);
    });

    const enrollmentByCourseId = new Map<string, IEnrollment>();
    if (userId) {
      const courseIds = courses.map((course) => course._id);
      const enrollments = await Enrollment.find({
        userId,
        courseId: { $in: courseIds },
      });
      for (const enrollment of enrollments) {
        enrollmentByCourseId.set(String(enrollment.courseId), enrollment);
      }
    }

    const payload = courses.map((course) => {
      const enrollment = userId
        ? enrollmentByCourseId.get(String(course._id)) ?? null
        : null;
      const ownerId = getCourseOwnerId(course);
      const ownerNameFallback = ownerId ? ownerNameById.get(ownerId) ?? "" : "";
      return buildCourseSummary(course, enrollment, ownerNameFallback);
    });

    res.json({ courses: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:courseId/preview", optionalAuth, async (req: Request, res: Response) => {
  try {
    const userId = getRequesterUserId(req);
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

    const visibility = getCourseVisibility(course);
    const accessState =
      userId != null ? await getAccessState(userId, course) : { isOwner: false, enrollment: null };
    const { isOwner, enrollment } = accessState;
    const canView = userId != null ? isOwner || !!enrollment || visibility === "published" : visibility === "published";

    if (!canView) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const outline = buildNormalizedOutline(course).sort((a, b) => a.order - b.order);
    const ownerId = getCourseOwnerId(course);
    const ownerNameFallback =
      ownerId && Types.ObjectId.isValid(ownerId)
        ? (await User.findById(ownerId).select("name"))?.name ?? ""
        : "";

    res.json({
      course: buildCourseSummary(course, enrollment, ownerNameFallback),
      curriculumOutline: outline,
      access: {
        isOwner,
        isEnrolled: !!enrollment,
        canEnroll: !!userId && !isOwner && !enrollment && visibility === "published",
        requiresAuthToEnroll: !userId,
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

    const ownerId = getCourseOwnerId(course);
    const isOwner = ownerId === userId;
    const visibility = getCourseVisibility(course);
    if (!isOwner && visibility !== "published") {
      res.status(403).json({ error: "Course is not published" });
      return;
    }

    if (!isCourseReadyForLearners(course)) {
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

    const curriculumRaw = readCourseField(course, "curriculum");
    const modulesRaw = readCourseField(course, "modules");
    const moduleCollection = Array.isArray(curriculumRaw)
      ? curriculumRaw
      : Array.isArray(modulesRaw)
      ? modulesRaw
      : [];
    const matchedModule = moduleCollection.find((module: any) =>
      Array.isArray(module?.lessons)
        ? module.lessons.some((lesson: any) => {
            const lessonIdValue = String(lesson?.lessonId ?? lesson?.id ?? "");
            return lessonIdValue === req.params.lessonId;
          })
        : false
    );
    const moduleQuizRaw = matchedModule?.moduleQuiz ?? null;
    const currentModuleId = matchedModule
      ? String(matchedModule.moduleId ?? matchedModule.id ?? "")
      : "";

    let isLastLessonInModule = false;
    if (matchedModule && Array.isArray(matchedModule.lessons) && matchedModule.lessons.length > 0) {
      const lastLesson = matchedModule.lessons[matchedModule.lessons.length - 1];
      const lastLessonId = String(lastLesson?.lessonId ?? lastLesson?.id ?? "");
      isLastLessonInModule = lastLessonId === req.params.lessonId;
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
        videoReferences: lessonRecord.lesson.videoReferences ?? [],
        contentMarkdown: lessonRecord.lesson.contentMarkdown,
        citations: lessonRecord.lesson.citations ?? [],
        quiz: lessonRecord.lesson.quiz.map((question) => ({
          questionId: question.questionId,
          prompt: question.prompt,
        })),
        moduleQuiz: isLastLessonInModule && moduleQuizRaw
          ? {
              quizId: String(moduleQuizRaw.quizId ?? ""),
              title: String(moduleQuizRaw.title ?? "Module Quiz"),
              questions: Array.isArray(moduleQuizRaw.questions)
                ? moduleQuizRaw.questions.map((question: any) => ({
                    questionId: String(question?.questionId ?? ""),
                    prompt: String(question?.prompt ?? ""),
                  }))
                : [],
            }
          : null,
      },
      navigation: {
        previousLessonId,
        nextLessonId,
        isFinalLesson: !nextLessonId,
        isLastLessonInModule,
        moduleId: currentModuleId,
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

    const ownerId = getCourseOwnerId(course);
    if (ownerId !== userId) {
      res.status(403).json({ error: "Only owner can publish this course" });
      return;
    }

    const desired = String(req.body?.visibility ?? "");
    if (desired !== "draft" && desired !== "published") {
      res.status(400).json({ error: "Invalid visibility value" });
      return;
    }

    (course as any).set("visibility", desired, { strict: false });
    await course.save();

    const enrollment = await Enrollment.findOne({ userId, courseId: course._id });
    const ownerNameFallback = (await User.findById(userId).select("name"))?.name ?? "";
    res.json({
      course: buildCourseSummary(course, enrollment, ownerNameFallback),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/mine/list", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.jwtUser as JwtPayload;
    const userObjectId = toObjectIdSafe(userId);
    const ownerMatchFilters: Array<Record<string, unknown>> = [{ ownerId: userId }, { userId }];
    if (userObjectId) {
      ownerMatchFilters.push({ ownerId: userObjectId }, { userId: userObjectId });
    }

    const courses = await Course.find({
      $or: ownerMatchFilters,
    }).sort({ updatedAt: -1 });

    const courseIds = courses.map((course) => course._id);
    const enrollments = await Enrollment.find({ userId, courseId: { $in: courseIds } });
    const enrollmentByCourseId = new Map<string, IEnrollment>();
    for (const enrollment of enrollments) {
      enrollmentByCourseId.set(String(enrollment.courseId), enrollment);
    }
    const ownerNameById = await buildOwnerNameMap(courses);

    res.json({
      courses: courses.map((course) =>
        buildCourseSummary(
          course,
          enrollmentByCourseId.get(String(course._id)) ?? null,
          ownerNameById.get(getCourseOwnerId(course) ?? "") ?? ""
        )
      ),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /courses/:courseId/modules/:moduleId/quiz
router.get("/:courseId/modules/:moduleId/quiz", requireAuth, async (req: Request, res: Response) => {
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

    const curriculumRaw = readCourseField(course, "curriculum");
    const modulesRaw = readCourseField(course, "modules");
    const moduleCollection = Array.isArray(curriculumRaw)
      ? curriculumRaw
      : Array.isArray(modulesRaw)
      ? modulesRaw
      : [];

    const targetModuleId = req.params.moduleId;
    const matchedModule = moduleCollection.find((module: any) => {
      const modId = String(module?.moduleId ?? module?.id ?? "");
      return modId === targetModuleId;
    });

    if (!matchedModule) {
      res.status(404).json({ error: "Module not found" });
      return;
    }

    const moduleQuiz = matchedModule.moduleQuiz;
    if (!moduleQuiz || !Array.isArray(moduleQuiz.questions) || moduleQuiz.questions.length === 0) {
      res.status(404).json({ error: "No quiz found for this module" });
      return;
    }

    res.json({
      moduleId: targetModuleId,
      title: String(moduleQuiz.title ?? "Module Checkpoint"),
      questions: moduleQuiz.questions.map((question: any) => ({
        questionId: String(question?.questionId ?? ""),
        prompt: String(question?.prompt ?? ""),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /courses/:courseId/modules/:moduleId/quiz-attempts
router.post("/:courseId/modules/:moduleId/quiz-attempts", requireAuth, async (req: Request, res: Response) => {
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

    const curriculumRaw = readCourseField(course, "curriculum");
    const modulesRaw = readCourseField(course, "modules");
    const moduleCollection = Array.isArray(curriculumRaw)
      ? curriculumRaw
      : Array.isArray(modulesRaw)
      ? modulesRaw
      : [];

    const targetModuleId = req.params.moduleId;
    const matchedModule = moduleCollection.find((module: any) => {
      const modId = String(module?.moduleId ?? module?.id ?? "");
      return modId === targetModuleId;
    });

    if (!matchedModule) {
      res.status(404).json({ error: "Module not found" });
      return;
    }

    const moduleQuiz = matchedModule.moduleQuiz;
    if (!moduleQuiz || !Array.isArray(moduleQuiz.questions) || moduleQuiz.questions.length === 0) {
      res.status(404).json({ error: "No quiz found for this module" });
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

    const grade = gradeQuiz(moduleQuiz.questions, parsedAnswers);

    let moduleCompleted = false;
    if (grade.passed) {
      const enrollmentRecord = enrollment ?? (await ensureEnrollment(userId, course));
      if (!enrollmentRecord.completedModuleQuizIds.includes(targetModuleId)) {
        enrollmentRecord.completedModuleQuizIds.push(targetModuleId);
        await enrollmentRecord.save();
      }
      moduleCompleted = true;
    }

    res.json({
      score: grade.score,
      passThreshold: PASS_THRESHOLD,
      passed: grade.passed,
      feedback: grade.feedback,
      moduleCompleted,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
