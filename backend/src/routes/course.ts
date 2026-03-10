import { Router, type Request, type Response } from "express";
import { Types } from "mongoose";
import { requireAuth } from "../middleware/auth";
import { validateBody, generateCourseSchema } from "../middleware/validate";
import { sseHeaders, sendSSE, endSSE, startKeepAlive, stopKeepAlive } from "../middleware/sse";
import { Conversation } from "../models/Conversation";
import { Course } from "../models/Course";
import { GenerationJob } from "../models/GenerationJob";
import "../models/Resource"; // Ensure it is registered for population
import { startGenerationJob } from "../services/course/jobRunner";
import { registerClient, unregisterClient, getBroadcaster } from "../services/sse/broadcaster";
import { generateLimiter } from "../middleware/rateLimiter";
import { gradeOpenEndedAnswer } from "../services/ai/grader";
import type { GenerateCourseRequest, UpdateProgressRequest } from "../types";
import { logger } from "../config/logger";

const router = Router();

// ── POST /course/generate ─────────────────────────────────────────────────
// Returns { jobId } — client then connects to GET /course/jobs/:jobId/events

router.post(
  "/generate",
  requireAuth,
  generateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.body as GenerateCourseRequest;
      const userId = req.jwtUser!.userId;

      if (!conversationId) {
        res.status(400).json({ error: "conversationId is required", code: "INVALID_PHASE" });
        return;
      }

      logger.info({ conversationId, userId }, "[course/generate] Starting generation");

      const jobId = await startGenerationJob(conversationId, userId);
      res.json({ jobId });
    } catch (error) {
      logger.error({ err: error }, "[course/generate] Error");
      const internal = error instanceof Error ? error.message : "";
      let status = 500;
      let userMessage = "Something went wrong. Please try again.";
      if (internal.toLowerCase().includes("not found")) {
        status = 404;
        userMessage = "We couldn't find what you're looking for.";
      } else if (internal.toLowerCase().includes("phase")) {
        status = 400;
        userMessage = "Please complete the previous step first.";
      }
      res.status(status).json({ error: userMessage, code: "AI_ERROR" });
    }
  }
);

// ── GET /course/jobs/:jobId ───────────────────────────────────────────────
// JSON polling fallback for job status

router.get(
  "/jobs/:jobId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const userId = req.jwtUser!.userId;

      if (!Types.ObjectId.isValid(jobId)) {
        res.status(400).json({ error: "Invalid job ID" });
        return;
      }

      const job = await GenerationJob.findOne({
        _id: jobId,
        userId: new Types.ObjectId(userId),
      });

      if (!job) {
        res.status(404).json({ error: "Job not found", code: "NOT_FOUND" });
        return;
      }

      const progressPercent =
        job.totalLessonCount > 0
          ? Math.round((job.completedLessonCount / job.totalLessonCount) * 90) + 10
          : 10;

      res.json({
        jobId: job._id.toString(),
        courseId: job.courseId.toString(),
        status: job.status,
        currentPhase: job.currentPhase,
        completedLessonCount: job.completedLessonCount,
        totalLessonCount: job.totalLessonCount,
        progressPercent: Math.min(progressPercent, job.status === "completed" ? 100 : 95),
        lessonSlots: job.lessonSlots.map((slot) => ({
          lessonId: slot.lessonId,
          title: slot.title,
          bloomsLevel: slot.bloomsLevel,
          status: slot.status,
        })),
        errorMessage: job.errorMessage,
      });
    } catch (error) {
      logger.error({ err: error }, "[jobs/status] Error");
      res.status(500).json({ error: "Failed to get job status", code: "DB_ERROR" });
    }
  }
);

// ── GET /course/jobs/:jobId/events ────────────────────────────────────────
// SSE stream with Last-Event-ID reconnection support

router.get(
  "/jobs/:jobId/events",
  requireAuth,
  sseHeaders,
  async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const userId = req.jwtUser!.userId;

    if (!Types.ObjectId.isValid(jobId)) {
      sendSSE(res, "error", { message: "Invalid job ID" });
      endSSE(res);
      return;
    }

    const job = await GenerationJob.findOne({
      _id: jobId,
      userId: new Types.ObjectId(userId),
    });

    if (!job) {
      sendSSE(res, "error", { message: "Job not found" });
      endSSE(res);
      return;
    }

    const keepAlive = startKeepAlive(res);

    // Register this client for live events
    registerClient(jobId, res);

    // Load course curriculum for module titles (needed for catch-up reconstruction)
    const catchUpCourse = await Course.findById(job.courseId).select("curriculum");
    const modules = (catchUpCourse?.curriculum ?? []).map((mod, idx) => ({
      index: idx,
      title: mod.title,
      lessonCount: mod.lessons.length,
    }));

    // Send current job state for catch-up (handles reconnects)
    const progressPercent =
      job.totalLessonCount > 0
        ? Math.round((job.completedLessonCount / job.totalLessonCount) * 90) + 10
        : 10;

    sendSSE(res, "job_state", {
      jobId: job._id.toString(),
      courseId: job.courseId.toString(),
      status: job.status,
      currentPhase: job.currentPhase,
      completedLessonCount: job.completedLessonCount,
      totalLessonCount: job.totalLessonCount,
      progressPercent: Math.min(progressPercent, job.status === "completed" ? 100 : 95),
      modules,
      lessonSlots: job.lessonSlots.map((slot) => ({
        lessonId: slot.lessonId,
        title: slot.title,
        bloomsLevel: slot.bloomsLevel,
        moduleIndex: slot.moduleIndex,
        status: slot.status,
      })),
    });

    // If already completed/failed, send final event and close
    if (job.status === "completed") {
      const course = await Course.findById(job.courseId).select("title slug description estimatedHours curriculum");
      const lessonCount = job.completedLessonCount;
      const moduleCount = course?.curriculum?.length ?? 0;
      sendSSE(res, "complete", {
        courseId: job.courseId.toString(),
        slug: (course as any)?.slug ?? "",
        title: course?.title ?? "",
        description: course?.description ?? "",
        moduleCount,
        lessonCount,
        estimatedHours: course?.estimatedHours ?? 0,
      });
      stopKeepAlive(keepAlive);
      unregisterClient(jobId, res);
      endSSE(res);
      return;
    }

    if (job.status === "failed") {
      sendSSE(res, "error", {
        message: job.errorMessage ?? "Generation failed",
        retryable: true,
        courseId: job.courseId.toString(),
      });
      stopKeepAlive(keepAlive);
      unregisterClient(jobId, res);
      endSSE(res);
      return;
    }

    // Client disconnects
    req.on("close", () => {
      stopKeepAlive(keepAlive);
      unregisterClient(jobId, res);
    });
  }
);

// ── GET /course/generation-status/:conversationId (legacy compat) ─────────

router.get(
  "/generation-status/:conversationId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.jwtUser!.userId;

      if (!Types.ObjectId.isValid(conversationId)) {
        res.status(400).json({ error: "Invalid conversation ID" });
        return;
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        userId: new Types.ObjectId(userId),
      });

      if (!conversation) {
        res.status(404).json({ error: "Conversation not found", code: "NOT_FOUND" });
        return;
      }

      let status: "pending" | "in_progress" | "completed" | "failed";
      let courseId: string | undefined;
      let courseSlug: string | undefined;
      let jobId: string | undefined;

      switch (conversation.phase) {
        case "resource_retrieval":
          status = "pending";
          break;
        case "course_generation":
          status = "in_progress";
          jobId = conversation.activeJobId?.toString();
          break;
        case "completed":
          status = "completed";
          courseId = conversation.courseId?.toString();
          if (conversation.courseId) {
            const c = await Course.findById(conversation.courseId).select("slug").lean();
            courseSlug = (c as any)?.slug ?? "";
          }
          break;
        default:
          status = "pending";
      }

      res.json({ conversationId, status, phase: conversation.phase, courseId, slug: courseSlug, jobId });
    } catch (error) {
      logger.error({ err: error }, "Generation status error");
      res.status(500).json({ error: "Failed to get status", code: "DB_ERROR" });
    }
  }
);

// ── GET /course ───────────────────────────────────────────────────────────

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.jwtUser!.userId;
    const { status, limit = "20", offset = "0" } = req.query;

    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (status && typeof status === "string") {
      query.status = status;
    }

    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 50);
    const offsetNum = parseInt(offset as string, 10) || 0;

    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort({ updatedAt: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .select("-modules.lessons.content"), // Exclude lesson content for list view
      Course.countDocuments(query),
    ]);

    res.json({
      courses: courses.map((course) => ({
        id: course._id.toString(),
        title: course.title,
        description: course.description,
        subject: course.subject,
        level: course.level,
        status: course.status,
        progress: course.progress,
        estimatedHours: course.estimatedHours,
        moduleCount: course.modules.length,
        createdAt: course.createdAt.toISOString(),
        lastAccessedAt: course.progress.lastAccessedAt?.toISOString(),
      })),
      total,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    logger.error({ err: error }, "List courses error");
    res.status(500).json({ error: "Failed to list courses", code: "DB_ERROR" });
  }
});

// ── GET /course/:id ───────────────────────────────────────────────────────

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.jwtUser!.userId;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    const course = await Course.findById(id).populate("resources", "title authors source");

    if (!course) {
      res.status(404).json({
        error: "Course not found",
        code: "NOT_FOUND",
      });
      return;
    }

    if (course.userId.toString() !== userId) {
      res.status(403).json({
        error: "Not authorized to access this course",
        code: "FORBIDDEN",
      });
      return;
    }

    // Update last accessed
    course.progress.lastAccessedAt = new Date();
    await course.save();

    res.json({
      course: {
        id: course._id.toString(),
        title: course.title,
        description: course.description,
        subject: course.subject,
        level: course.level,
        status: course.status,
        estimatedHours: course.estimatedHours,
        modules: course.modules.map((module) => ({
          id: module.id,
          title: module.title,
          description: module.description,
          order: module.order,
          completed: module.completed,
          lessons: module.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            estimatedMinutes: lesson.estimatedMinutes,
            content: lesson.content,
            videoLinks: lesson.videoLinks,
            resources: lesson.resources,
            completed: lesson.completed,
          })),
        })),
        resources: course.resources,
        progress: {
          completedLessons: course.progress.completedLessons,
          totalLessons: course.progress.totalLessons,
          percentComplete: course.progress.percentComplete,
          lastAccessedAt: course.progress.lastAccessedAt?.toISOString(),
        },
        generatedAt: course.generatedAt.toISOString(),
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Get course error");
    res.status(500).json({ error: "Failed to get course", code: "DB_ERROR" });
  }
});

// ── POST /course/:id/modules/:moduleId/lessons/:lessonId/quizzes/:quizId/questions/:questionId/answer ──

router.post(
  "/:id/modules/:moduleId/lessons/:lessonId/quizzes/:quizId/questions/:questionId/answer",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id, moduleId, lessonId, quizId, questionId } = req.params;
      const { answer } = req.body;
      const userId = req.jwtUser!.userId;

      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: "Invalid course ID" });
        return;
      }

      const courseDoc = await Course.findById(id);

      if (!courseDoc) {
        res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
        return;
      }

      if (courseDoc.userId.toString() !== userId) {
        res.status(403).json({ error: "Not authorized", code: "FORBIDDEN" });
        return;
      }

      let questionFound = false;
      let isCorrect = false;

      const module = courseDoc.modules.find((m) => m.id === moduleId);
      if (!module) {
        res.status(404).json({ error: "Module not found", code: "NOT_FOUND" });
        return;
      }

      const lesson = module.lessons.find((l) => l.id === lessonId);
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found", code: "NOT_FOUND" });
        return;
      }

      const quiz = lesson.quizzes?.find((q) => q.id === quizId);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found", code: "NOT_FOUND" });
        return;
      }

      const question = quiz.questions.find((q) => q.id === questionId);
      if (!question) {
        res.status(404).json({ error: "Question not found", code: "NOT_FOUND" });
        return;
      }

      questionFound = true;

      // Check answer correctness
      let explanation = question.explanation;

      if (question.type === "multiple_choice") {
        isCorrect = parseInt(answer, 10) === question.correctAnswerIndex;
      } else if (question.type === "open_ended") {
        const aiEvaluation = await gradeOpenEndedAnswer({
          question: question.question,
          expectedAnswer: question.correctAnswerText || "",
          studentAnswer: answer,
          lessonContent: lesson.content,
        });
        isCorrect = aiEvaluation.isCorrect;
        explanation = aiEvaluation.feedback;
      }

      question.isAnsweredCorrectly = isCorrect;

      // Update quiz completion status
      quiz.isCompleted = quiz.questions.every((q) => q.isAnsweredCorrectly);

      await courseDoc.save();

      res.json({
        success: true,
        isCorrect,
        explanation,
        quizCompleted: quiz.isCompleted,
      });
    } catch (error) {
      logger.error({ err: error }, "Answer question error");
      res.status(500).json({ error: "Failed to answer question", code: "DB_ERROR" });
    }
  }
);

// ── PUT /course/:id/progress ──────────────────────────────────────────────

router.put("/:id/progress", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { lessonId, completed } = req.body as UpdateProgressRequest;
    const userId = req.jwtUser!.userId;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid course ID" });
      return;
    }

    if (!lessonId) {
      res.status(400).json({ error: "lessonId is required" });
      return;
    }

    const course = await Course.findById(id);

    if (!course) {
      res.status(404).json({
        error: "Course not found",
        code: "NOT_FOUND",
      });
      return;
    }

    if (course.userId.toString() !== userId) {
      res.status(403).json({
        error: "Not authorized to update this course",
        code: "FORBIDDEN",
      });
      return;
    }

    // Find and update the lesson
    let lessonFound = false;
    let moduleCompleted = false;
    let courseCompleted = false;

    const courseDoc = await Course.findById(id);
    if (!courseDoc) {
      res.status(404).json({ error: "Course not found", code: "NOT_FOUND" });
      return;
    }

    for (const module of courseDoc.modules) {
      for (const lesson of module.lessons) {
        if (lesson.id === lessonId) {
          // Check if quizzes/interactive elements block completion
          const hasIncompleteQuizzes = lesson.quizzes?.some((q) => !q.isCompleted);
          const hasIncompleteInteractiveElements = lesson.interactiveElements?.some((ie) => !ie.isCompleted);

          if (completed && (hasIncompleteQuizzes || hasIncompleteInteractiveElements)) {
            res.status(400).json({ error: "All quizzes and interactive elements must be completed first." });
            return;
          }

          lesson.completed = completed;
          lessonFound = true;
          break;
        }
      }

      if (lessonFound) {
        // Check if all lessons in module are complete
        const allLessonsComplete = module.lessons.every((l) => l.completed);
        if (allLessonsComplete !== module.completed) {
          module.completed = allLessonsComplete;
          if (allLessonsComplete) {
            moduleCompleted = true;
          }
        }
        break;
      }
    }

    if (!lessonFound) {
      res.status(404).json({
        error: "Lesson not found",
        code: "NOT_FOUND",
      });
      return;
    }

    // Recalculate progress
    const completedLessons = courseDoc.modules.reduce(
      (total, module) => total + module.lessons.filter((l) => l.completed).length,
      0
    );

    courseDoc.progress.completedLessons = completedLessons;
    courseDoc.progress.percentComplete =
      courseDoc.progress.totalLessons > 0
        ? Math.round((completedLessons / courseDoc.progress.totalLessons) * 100)
        : 0;
    courseDoc.progress.lastAccessedAt = new Date();

    // Check if course is complete
    if (courseDoc.progress.percentComplete === 100) {
      courseDoc.status = "completed";
      courseCompleted = true;
    }

    await courseDoc.save();

    res.json({
      success: true,
      progress: {
        completedLessons: courseDoc.progress.completedLessons,
        totalLessons: courseDoc.progress.totalLessons,
        percentComplete: courseDoc.progress.percentComplete,
      },
      moduleCompleted,
      courseCompleted,
    });
  } catch (error) {
    logger.error({ err: error }, "Update progress error");
    res.status(500).json({ error: "Failed to update progress", code: "DB_ERROR" });
  }
});

export default router;
