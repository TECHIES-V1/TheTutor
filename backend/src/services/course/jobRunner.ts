import { randomUUID } from "crypto";
import { Types } from "mongoose";
import { GenerationJob } from "../../models/GenerationJob";
import { Course, type IGeneratedLesson, type IGeneratedModule } from "../../models/Course";
import { Conversation } from "../../models/Conversation";
import { Enrollment } from "../../models/Enrollment";
import { User } from "../../models/User";
import { discoverSourceReferences } from "../ai/nova";
import { generateCourseOutline, type CourseOutline, type OutlineLesson, type OutlineModule } from "./outline";
import { generateLessonContent } from "./lessonGen";
import { fetchVideoReferencesForQueries } from "../youtube/youtube.service";
import type { SSEBroadcaster } from "../sse/broadcaster";
import { getBroadcaster, createNoOpBroadcaster } from "../sse/broadcaster";
import type { OnboardingData } from "../../types/index";
import { logger } from "../../config/logger";
import pLimit from "p-limit";

const MAX_LESSON_ATTEMPTS = 2;
const LESSON_CONCURRENCY = 4;
const VIDEO_CONCURRENCY = 6;

// ── Start a new generation job ────────────────────────────────────────────
// Validates conversation, runs MCP discovery, creates outline skeleton,
// persists course + job to DB, then fires runJob() in the background.
// Returns jobId immediately so the HTTP response can be sent.

export async function startGenerationJob(
  conversationId: string,
  userId: string
): Promise<string> {
  // Atomic phase lock — prevents duplicate generation from concurrent requests
  const conversation = await Conversation.findOneAndUpdate(
    {
      _id: conversationId,
      userId: new Types.ObjectId(userId),
      phase: "resource_retrieval",
    },
    { $set: { phase: "course_generation" } },
    { new: true }
  );

  if (!conversation) {
    // Either not found, wrong user, or already generating
    const exists = await Conversation.findOne({
      _id: conversationId,
      userId: new Types.ObjectId(userId),
    });
    if (!exists) throw new Error("Conversation not found");
    throw new Error(
      `Conversation must be in resource_retrieval phase. Current: ${exists.phase}`
    );
  }

  const onboardingData: OnboardingData = {
    topic: conversation.onboardingData.topic,
    level: conversation.onboardingData.level,
    hoursPerWeek: conversation.onboardingData.hoursPerWeek,
    goal: conversation.onboardingData.goal,
    confirmedSubject: conversation.onboardingData.confirmedSubject,
  };

  const owner = await User.findById(userId).select("name");
  const ownerName = owner?.name ?? "Course Creator";

  // Phase 1: Discover source references via MCP
  // Uses confirmedSubject (e.g. "British History") as a single focused search term
  const mcpKeyword = onboardingData.confirmedSubject || onboardingData.topic || "";
  logger.info({ keyword: mcpKeyword }, "[jobRunner] Discovering source references");
  let sourceReferences: Array<{ title: string; authors: string[]; source: string }> = [];
  try {
    sourceReferences = await discoverSourceReferences(onboardingData);
    logger.info({ count: sourceReferences.length }, "[jobRunner] Found source references");
  } catch (err) {
    logger.warn({ err }, "[jobRunner] MCP discovery failed, continuing without sources");
  }

  // Phase 2: Generate course outline (fast, structured JSON — retry up to 2×)
  logger.info("[jobRunner] Generating course outline...");
  let outline: CourseOutline | undefined;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      outline = await generateCourseOutline(onboardingData, sourceReferences);
      break;
    } catch (err) {
      logger.warn({ err, attempt }, "[jobRunner] Outline generation attempt failed");
      if (attempt === 2) throw err;
    }
  }
  if (!outline) throw new Error("outline_parse_failed: No outline generated");

  // Build flat lesson slots from outline
  const lessonSlots = outline.modules.flatMap((mod, modIdx) =>
    mod.lessons.map((les, lesIdx) => ({
      moduleIndex: modIdx,
      lessonIndex: lesIdx,
      lessonId: les.lessonId,
      title: les.title,
      bloomsLevel: les.bloomsLevel as 1 | 2 | 3 | 4 | 5 | 6,
      status: "pending" as const,
      attempts: 0,
    }))
  );

  // Create skeleton course document with pending lessons
  const skeletonCurriculum: IGeneratedModule[] = outline.modules.map((mod) => ({
    moduleId: mod.moduleId,
    order: mod.order,
    title: mod.title,
    description: mod.description,
    bloomsRange: mod.bloomsRange,
    lessons: mod.lessons.map((les) => ({
      lessonId: les.lessonId,
      order: les.order,
      title: les.title,
      summary: les.summary,
      status: "pending" as const,
      bloomsLevel: les.bloomsLevel,
      bloomsVerb: les.bloomsVerb,
      estimatedMinutes: les.estimatedMinutes,
      videoUrl: "",
      videoReferences: [],
      contentMarkdown: "",
      keyTakeaways: [],
      citations: [],
      quiz: [],
      exercises: [],
    })),
  }));

  const totalLessons = lessonSlots.length;
  const estimatedHours = outline.estimatedTotalHours ||
    Math.round((lessonSlots.reduce((sum, s) => {
      const les = outline.modules[s.moduleIndex]?.lessons[s.lessonIndex];
      return sum + (les?.estimatedMinutes ?? 25);
    }, 0) / 60) * 10) / 10;

  const course = await Course.create({
    userId: new Types.ObjectId(userId),
    ownerId: new Types.ObjectId(userId),
    ownerName,
    conversationId: new Types.ObjectId(conversationId),
    title: outline.title,
    description: outline.description,
    subject: onboardingData.confirmedSubject || onboardingData.topic || "",
    topic: onboardingData.topic || "",
    goal: onboardingData.goal || "",
    level: onboardingData.level || "beginner",
    status: "generating",
    visibility: "draft",
    accessModel: "free_hackathon",
    generationStatus: "pending",
    createdBy: "generator",
    curriculum: skeletonCurriculum,
    sourceReferences,
    modules: [],
    estimatedHours,
    resources: [],
    progress: {
      completedLessons: 0,
      totalLessons,
      percentComplete: 0,
    },
  });

  const job = await GenerationJob.create({
    courseId: course._id,
    conversationId: new Types.ObjectId(conversationId),
    userId: new Types.ObjectId(userId),
    status: "pending",
    currentPhase: "lessons",
    lessonSlots,
    completedLessonCount: 0,
    totalLessonCount: totalLessons,
    sourceReferences,
    lastEventId: 0,
    startedAt: new Date(),
  });

  const jobId = job._id.toString();

  // Update course with job reference
  course.generationJobId = job._id;
  await course.save();

  // Update conversation (phase already set atomically above)
  conversation.activeJobId = job._id;
  await conversation.save();

  logger.info({ jobId, courseId: course._id.toString() }, "[jobRunner] Created job for course");

  // Fire generation in background — do NOT await
  const broadcaster = getBroadcaster(jobId);

  // Emit outline_done immediately so frontend can show modules
  const outlineEvent = {
    courseId: course._id.toString(),
    modules: outline.modules.map((m) => ({
      moduleId: m.moduleId,
      title: m.title,
      lessonCount: m.lessons.length,
      bloomsRange: m.bloomsRange,
    })),
    totalLessons,
  };

  job.lastEventId += 1;
  await job.save();
  broadcaster.send("outline_done", outlineEvent, job.lastEventId);

  runJob(jobId, broadcaster, outline, onboardingData).catch((err) => {
    logger.error({ err, jobId }, "[jobRunner] Unhandled error in background job");
  });

  return jobId;
}

// ── Run (or resume) a generation job ─────────────────────────────────────

export async function runJob(
  jobId: string,
  broadcast: SSEBroadcaster,
  preloadedOutline?: CourseOutline,
  preloadedOnboardingData?: OnboardingData
): Promise<void> {
  const job = await GenerationJob.findById(jobId);
  if (!job) {
    logger.error({ jobId }, "[jobRunner] Job not found");
    return;
  }

  if (job.status === "completed" || job.status === "failed") {
    logger.info({ jobId, status: job.status }, "[jobRunner] Job already completed/failed, skipping");
    return;
  }

  job.status = "running";
  await job.save();

  const course = await Course.findById(job.courseId);
  if (!course) {
    job.status = "failed";
    job.errorMessage = "Course document not found";
    await job.save();
    broadcast.send("error", { message: "Course not found", retryable: false });
    return;
  }

  const conversation = await Conversation.findById(job.conversationId);
  if (!conversation) {
    job.status = "failed";
    job.errorMessage = "Conversation not found";
    await job.save();
    broadcast.send("error", { message: "Conversation not found", retryable: false });
    return;
  }

  const onboardingData: OnboardingData = preloadedOnboardingData ?? {
    topic: conversation.onboardingData.topic,
    level: conversation.onboardingData.level,
    hoursPerWeek: conversation.onboardingData.hoursPerWeek,
    goal: conversation.onboardingData.goal,
    confirmedSubject: conversation.onboardingData.confirmedSubject,
  };

  const sourceReferences = job.sourceReferences;

  // Rebuild outline from course curriculum if not preloaded (crash recovery)
  const outline: CourseOutline = preloadedOutline ?? rebuildOutlineFromCourse(course, job);

  // ── Phase: lessons (parallel with p-limit) ──────────────────────────
  job.currentPhase = "lessons";
  await job.save();

  // Pre-compute context titles from outline order (known upfront)
  // Each lesson gets titles of all lessons before it in the outline
  const allSlotTitles = job.lessonSlots.map((s) => s.title);

  const limit = pLimit(LESSON_CONCURRENCY);

  const lessonTasks = job.lessonSlots.map((slot, slotIndex) =>
    limit(async () => {
      if (slot.status === "done") return;

      const mod = outline.modules[slot.moduleIndex];
      const les = mod?.lessons[slot.lessonIndex];
      if (!mod || !les) {
        logger.warn({ lessonId: slot.lessonId }, "[jobRunner] Missing outline data for slot");
        slot.status = "failed";
        slot.error = "Missing outline data";
        return;
      }

      slot.status = "generating";
      job.lastEventId += 1;
      await job.save();

      const progress = Math.round(
        10 + ((job.completedLessonCount / job.totalLessonCount) * 80)
      );

      broadcast.send(
        "lesson_started",
        {
          lessonId: slot.lessonId,
          title: slot.title,
          bloomsLevel: slot.bloomsLevel,
          moduleIndex: slot.moduleIndex,
          lessonIndex: slot.lessonIndex,
          progress,
        },
        job.lastEventId
      );

      // Context: titles of all lessons ordered before this one
      const previousTitles = allSlotTitles.slice(0, slotIndex);

      let succeeded = false;

      for (let attempt = 0; attempt < MAX_LESSON_ATTEMPTS; attempt++) {
        try {
          slot.attempts += 1;
          logger.info(
            { lessonTitle: les.title, attempt: attempt + 1 },
            "[jobRunner] Generating lesson"
          );

          const content = await generateLessonContent(
            les,
            mod,
            outline,
            onboardingData,
            sourceReferences,
            previousTitles
          );

          // Save lesson content atomically — no full-document reload/save race
          const prefix = `curriculum.${slot.moduleIndex}.lessons.${slot.lessonIndex}`;
          await Course.updateOne(
            { _id: course._id },
            {
              $set: {
                [`${prefix}.contentMarkdown`]: content.contentMarkdown,
                [`${prefix}.keyTakeaways`]: content.keyTakeaways,
                [`${prefix}.citations`]: content.citations,
                [`${prefix}.quiz`]: (content.quiz ?? []).map((q) => ({
                  questionId: q.questionId,
                  prompt: q.prompt,
                  expectedConcepts: q.expectedConcepts,
                  remediationTip: q.remediationTip,
                })),
                [`${prefix}.exercises`]: content.exercises ?? [],
                [`${prefix}.videoSearchQueries`]: content.videoSearchQueries ?? [],
                [`${prefix}.estimatedMinutes`]: content.estimatedMinutes,
                [`${prefix}.status`]: "ready",
              },
            }
          );

          slot.status = "done";
          job.completedLessonCount += 1;
          job.lastEventId += 1;
          await job.save();

          const doneProgress = Math.round(
            10 + ((job.completedLessonCount / job.totalLessonCount) * 80)
          );

          broadcast.send(
            "lesson_done",
            {
              lessonId: slot.lessonId,
              title: slot.title,
              bloomsLevel: slot.bloomsLevel,
              completedCount: job.completedLessonCount,
              totalCount: job.totalLessonCount,
              progress: doneProgress,
            },
            job.lastEventId
          );

          succeeded = true;
          break;
        } catch (err) {
          logger.warn(
            { err, lessonTitle: les.title, attempt: attempt + 1 },
            "[jobRunner] Lesson generation attempt failed"
          );
          slot.error = err instanceof Error ? err.message : String(err);
        }
      }

      if (!succeeded) {
        slot.status = "failed";
        job.lastEventId += 1;
        await job.save();

        broadcast.send(
          "lesson_failed",
          {
            lessonId: slot.lessonId,
            title: slot.title,
            error: slot.error ?? "Unknown error",
            isFatal: false,
          },
          job.lastEventId
        );
      }
    })
  );

  await Promise.allSettled(lessonTasks);

  // ── Phase: enrichment (videos — parallel) ───────────────────────────
  job.currentPhase = "enrichment";
  await job.save();

  // Re-read course to get latest videoSearchQueries written during parallel lesson gen
  const freshCourse = await Course.findById(job.courseId);
  const curriculum = (freshCourse?.curriculum ?? course.curriculum) as IGeneratedModule[];

  let enrichedCount = 0;
  const videoLimit = pLimit(VIDEO_CONCURRENCY);

  const videoTasks = job.lessonSlots
    .filter((slot) => slot.status === "done")
    .map((slot) =>
      videoLimit(async () => {
        const targetModule = curriculum[slot.moduleIndex];
        if (!targetModule) return;
        const targetLesson = targetModule.lessons[slot.lessonIndex];
        if (!targetLesson) return;

        const queries: string[] = (targetLesson.videoSearchQueries as string[] | undefined) ?? [];
        if (queries.length === 0) {
          const fallback = `${onboardingData.confirmedSubject || onboardingData.topic || ""} ${targetLesson.title} tutorial`.trim();
          queries.push(fallback);
        }

        try {
          const refs = await fetchVideoReferencesForQueries(queries);
          if (refs.length > 0) {
            const prefix = `curriculum.${slot.moduleIndex}.lessons.${slot.lessonIndex}`;
            await Course.updateOne(
              { _id: course._id },
              {
                $set: {
                  [`${prefix}.videoReferences`]: refs.map((r) => ({
                    url: r.url,
                    title: r.title,
                    channelName: r.channelName,
                    queryUsed: r.queryUsed,
                  })),
                  [`${prefix}.videoUrl`]: refs[0].url,
                },
              }
            );
            enrichedCount += 1;
          }
        } catch (err) {
          logger.warn({ err, lessonTitle: targetLesson.title }, "[jobRunner] Video fetch skipped for lesson");
        }
      })
    );

  await Promise.allSettled(videoTasks);

  job.lastEventId += 1;
  await job.save();
  broadcast.send("enrichment_done", { enrichedCount }, job.lastEventId);

  // ── Phase: done ───────────────────────────────────────────────────────
  job.currentPhase = "done";

  const successCount = job.lessonSlots.filter((s) => s.status === "done").length;
  const failedCount = job.lessonSlots.filter((s) => s.status === "failed").length;

  if (successCount === 0) {
    job.status = "failed";
    job.errorMessage = "All lessons failed to generate";
    await job.save();

    course.generationStatus = "failed";
    await course.save();

    conversation.phase = "resource_retrieval";
    conversation.activeJobId = undefined;
    await conversation.save();

    broadcast.send("error", {
      message: "Course generation failed — all lessons could not be generated.",
      retryable: true,
      courseId: course._id.toString(),
    });
    return;
  }

  // Finalize course
  const totalCompletedLessons = successCount;
  course.status = "active";
  course.generationStatus = "ready";
  course.progress.totalLessons = totalCompletedLessons;
  course.sourceReferences = sourceReferences;
  await course.save();

  // Create or update enrollment atomically — prevents duplicate-insert race
  const firstLesson = findFirstReadyLesson(curriculum);
  if (firstLesson) {
    await Enrollment.findOneAndUpdate(
      { userId: job.userId, courseId: course._id },
      {
        $setOnInsert: {
          status: "active",
          progressPercent: 0,
          currentLessonId: firstLesson,
          completedLessonIds: [],
          completedModuleQuizIds: [],
        },
      },
      { upsert: true, new: true }
    );
  }

  // Update user onboarding status
  await User.updateOne(
    { _id: job.userId },
    { $set: { onboardingCompleted: true } }
  );

  // Finalize conversation
  conversation.phase = "completed";
  conversation.status = "completed";
  conversation.courseId = course._id;
  conversation.activeJobId = undefined;
  await conversation.save();

  job.status = "completed";
  job.completedAt = new Date();
  job.lastEventId += 1;
  await job.save();

  const completionData = {
    courseId: course._id.toString(),
    title: course.title,
    description: course.description,
    moduleCount: curriculum.length,
    lessonCount: totalCompletedLessons,
    estimatedHours: course.estimatedHours,
    failedLessonCount: failedCount,
  };

  logger.info({ completionData }, "[jobRunner] Completed");

  broadcast.send("complete", completionData, job.lastEventId);
}

// ── Resume orphaned jobs on server startup ────────────────────────────────

export async function resumeOrphanedJobs(): Promise<void> {
  const staleThreshold = new Date(Date.now() - 60 * 1000); // 60 seconds

  const orphans = await GenerationJob.find({
    status: "running",
    updatedAt: { $lt: staleThreshold },
  });

  if (orphans.length === 0) return;

  logger.info({ count: orphans.length }, "[jobRunner] Resuming orphaned job(s)");

  for (const job of orphans) {
    logger.info({ jobId: job._id.toString() }, "[jobRunner] Resuming job");
    runJob(job._id.toString(), createNoOpBroadcaster()).catch((err) => {
      logger.error({ err, jobId: job._id.toString() }, "[jobRunner] Failed to resume job");
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function findFirstReadyLesson(curriculum: IGeneratedModule[]): string | null {
  for (const mod of curriculum) {
    for (const les of mod.lessons) {
      if (les.status === "ready" && les.lessonId) {
        return les.lessonId;
      }
    }
  }
  return null;
}

function rebuildOutlineFromCourse(
  course: InstanceType<typeof Course>,
  job: InstanceType<typeof GenerationJob>
): CourseOutline {
  const curriculum = course.curriculum as IGeneratedModule[];
  return {
    title: course.title,
    description: course.description,
    estimatedTotalHours: course.estimatedHours,
    targetAudience: "",
    modules: curriculum.map((mod, modIdx) => ({
      moduleId: mod.moduleId || randomUUID(),
      order: mod.order || modIdx + 1,
      title: mod.title,
      description: mod.description || "",
      bloomsRange: (mod.bloomsRange as [number, number] | undefined) ?? [1, 3],
      lessons: mod.lessons.map((les, lesIdx) => {
        const slot = job.lessonSlots.find(
          (s) => s.moduleIndex === modIdx && s.lessonIndex === lesIdx
        );
        return {
          lessonId: les.lessonId || slot?.lessonId || randomUUID(),
          order: les.order || lesIdx + 1,
          title: les.title,
          summary: les.summary || "",
          estimatedMinutes: les.estimatedMinutes || 25,
          bloomsLevel: (les.bloomsLevel as 1 | 2 | 3 | 4 | 5 | 6) ?? (slot?.bloomsLevel ?? 1),
          bloomsVerb: les.bloomsVerb || "learn",
        };
      }),
    })),
  };
}
