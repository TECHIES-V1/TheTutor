import { Router, type Request, type Response } from "express";
import { Types } from "mongoose";
import { requireAuth } from "../middleware/auth";
import { sseHeaders, sendSSE, endSSE, startKeepAlive, stopKeepAlive } from "../middleware/sse";
import { Conversation } from "../models/Conversation";
import { Course } from "../models/Course";
import "../models/Resource"; // Ensure it is registered for population
import { generate } from "../services/course/generator";
import type { GenerateCourseRequest, UpdateProgressRequest } from "../types";

const router = Router();

// ── POST /course/generate ─────────────────────────────────────────────────

router.post(
  "/generate",
  requireAuth,
  sseHeaders,
  async (req: Request, res: Response) => {
    const keepAlive = startKeepAlive(res);

    try {
      const { conversationId } = req.body as GenerateCourseRequest;
      const userId = req.jwtUser!.userId;

      if (!conversationId) {
        sendSSE(res, "error", {
          code: "INVALID_PHASE",
          message: "conversationId is required",
          retryable: false,
          phase: "resource_retrieval",
        });
        stopKeepAlive(keepAlive);
        endSSE(res);
        return;
      }

      // Verify conversation exists and is in correct phase
      const conversation = await Conversation.findOne({
        _id: conversationId,
        userId: new Types.ObjectId(userId),
      });

      if (!conversation) {
        sendSSE(res, "error", {
          code: "NOT_FOUND",
          message: "Conversation not found",
          retryable: false,
          phase: "resource_retrieval",
        });
        stopKeepAlive(keepAlive);
        endSSE(res);
        return;
      }

      if (conversation.phase !== "resource_retrieval") {
        sendSSE(res, "error", {
          code: "INVALID_PHASE",
          message: `Conversation must be in resource_retrieval phase. Current: ${conversation.phase}`,
          retryable: false,
          phase: conversation.phase,
        });
        stopKeepAlive(keepAlive);
        endSSE(res);
        return;
      }

      // Stream course generation events
      for await (const event of generate(conversationId, userId)) {
        sendSSE(res, event.type, event.data as unknown as Record<string, unknown>);

        // Stop on error or completion
        if (event.type === "error" || event.type === "complete") {
          break;
        }
      }
    } catch (error) {
      console.error("Course generation error:", error);
      sendSSE(res, "error", {
        code: "AI_ERROR",
        message: error instanceof Error ? error.message : "Course generation failed",
        retryable: true,
        phase: "course_generation",
      });
    } finally {
      stopKeepAlive(keepAlive);
      endSSE(res);
    }
  }
);

// ── GET /course/generation-status/:conversationId ─────────────────────────

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
        res.status(404).json({
          error: "Conversation not found",
          code: "NOT_FOUND",
        });
        return;
      }

      let status: "pending" | "in_progress" | "completed" | "failed";
      let phase: string | undefined;
      let courseId: string | undefined;

      switch (conversation.phase) {
        case "resource_retrieval":
          status = "pending";
          phase = "resource_retrieval";
          break;
        case "course_generation":
          status = "in_progress";
          phase = "course_generation";
          break;
        case "completed":
          status = "completed";
          courseId = conversation.courseId?.toString();
          break;
        default:
          status = "pending";
          phase = conversation.phase;
      }

      res.json({
        conversationId,
        status,
        phase,
        courseId,
      });
    } catch (error) {
      console.error("Generation status error:", error);
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
    console.error("List courses error:", error);
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
    console.error("Get course error:", error);
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
      if (question.type === "multiple_choice") {
        isCorrect = parseInt(answer, 10) === question.correctAnswerIndex;
      } else if (question.type === "open_ended") {
        // Simple case-insensitive exact match or inclusion for now.
        // In a real scenario, this might use AI grading.
        const expected = (question.correctAnswerText || "").toLowerCase().trim();
        const provided = (answer || "").toString().toLowerCase().trim();
        isCorrect = expected === provided || provided.includes(expected);
      }

      question.isAnsweredCorrectly = isCorrect;

      // Update quiz completion status
      quiz.isCompleted = quiz.questions.every((q) => q.isAnsweredCorrectly);

      await courseDoc.save();

      res.json({
        success: true,
        isCorrect,
        explanation: question.explanation,
        quizCompleted: quiz.isCompleted,
      });
    } catch (error) {
      console.error("Answer question error:", error);
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
    console.error("Update progress error:", error);
    res.status(500).json({ error: "Failed to update progress", code: "DB_ERROR" });
  }
});

export default router;
