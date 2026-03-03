import { randomUUID } from "crypto";
import { Types } from "mongoose";
import { Conversation } from "../../models/Conversation";
import {
  Course,
  type ILesson,
  type IModule,
  type IModuleQuiz,
  type ISourceReference,
} from "../../models/Course";
import { Enrollment } from "../../models/Enrollment";
import { User } from "../../models/User";
import {
  repairGeneratedCourseMarkdown,
  streamCourseWithMCPTools,
} from "../ai/nova";
import type {
  InteractiveElement,
  OnboardingData,
  Quiz,
  QuizQuestion,
  SSEEvent,
} from "../../types";
import {
  fetchVideoReferencesForQueries,
  type YouTubeVideoReference,
} from "../youtube/youtube.service";

const MAX_REPAIR_ATTEMPTS = 2;
const MIN_LESSON_CONTENT_CHARS = 180;

type StreamMilestoneEvent = Extract<
  SSEEvent,
  { type: "course_title" | "module_started" | "module_complete" }
>;

interface StreamMilestoneState {
  lineBuffer: string;
  courseTitle: string | null;
  modules: string[];
  activeModuleIndex: number | null;
}

interface ParsedCourse {
  title: string;
  description: string;
  modules: IModule[];
  totalLessons: number;
  estimatedHours: number;
}

interface SourceLedgerEntry {
  title: string;
  authors: string[];
  source: string;
}

interface ValidationResult {
  valid: boolean;
  issues: string[];
}

function ensureObjectId(value: string): Types.ObjectId {
  return new Types.ObjectId(value);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, "").trim();
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueSourceRefs(
  refs: Array<{ title: string; authors: string[]; source: string }>
): SourceLedgerEntry[] {
  const map = new Map<string, SourceLedgerEntry>();
  for (const ref of refs) {
    if (!isNonEmptyString(ref.title)) continue;
    const key = ref.title.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        title: ref.title.trim(),
        authors: Array.isArray(ref.authors)
          ? ref.authors.map((author) => String(author).trim()).filter(Boolean)
          : [],
        source: String(ref.source ?? "").trim(),
      });
    }
  }
  return [...map.values()];
}

function toFallbackCitation(source: SourceLedgerEntry): {
  citationText: string;
  sourceTitle: string;
  authors: string[];
  source: string;
  citationKey: string;
} {
  const authorText =
    source.authors.length > 0 ? source.authors.join(", ") : "Unknown Author";
  const citationText = `${authorText}. (n.d.). *${source.title}*. ${source.source || "Unknown publisher"}.`;
  return {
    citationText,
    sourceTitle: source.title,
    authors: source.authors,
    source: source.source,
    citationKey: source.title,
  };
}

function parseExpectedConcepts(raw: unknown): string[][] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((group) =>
      Array.isArray(group)
        ? group.map((item) => String(item).trim()).filter(Boolean)
        : []
    )
    .filter((group) => group.length > 0);
}

function toLegacyQuizQuestion(raw: any): QuizQuestion {
  const options = Array.isArray(raw?.options)
    ? raw.options.map((option: unknown) => String(option))
    : [];
  const explicitType = String(raw?.type ?? "").trim().toLowerCase();
  const type: "multiple_choice" | "open_ended" =
    explicitType === "multiple_choice" || options.length > 0
      ? "multiple_choice"
      : "open_ended";

  const expectedConcepts = parseExpectedConcepts(raw?.expectedConcepts);
  const firstExpectedConcept = expectedConcepts[0]?.[0] ?? "";

  return {
    id: String(raw?.id ?? raw?.questionId ?? randomUUID()),
    type,
    question: String(raw?.question ?? raw?.prompt ?? "").trim(),
    options,
    correctAnswerIndex:
      typeof raw?.correctAnswerIndex === "number" ? raw.correctAnswerIndex : undefined,
    correctAnswerText: String(
      raw?.correctAnswerText ?? firstExpectedConcept ?? ""
    ).trim(),
    explanation: String(raw?.explanation ?? raw?.remediationTip ?? "").trim() ||
      "Review the lesson content and try again.",
    isAnsweredCorrectly: false,
  };
}

function parseLessonQuiz(rawJson: string): Quiz[] {
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];
    const questions = parsed
      .map((item) => toLegacyQuizQuestion(item))
      .filter((question) => question.question.length > 0);
    if (questions.length === 0) return [];
    return [
      {
        id: randomUUID(),
        title: "Lesson Quiz",
        questions,
        isCompleted: false,
      },
    ];
  } catch (error) {
    console.error("[generator] Failed to parse lesson quiz JSON:", error);
    return [];
  }
}

function parseModuleQuiz(rawJson: string, moduleOrder: number): IModuleQuiz | undefined {
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return undefined;

    const questions = parsed
      .map((item: any, index: number) => ({
        questionId: String(item?.questionId ?? item?.id ?? `mq-${moduleOrder}-${index + 1}`),
        prompt: String(item?.prompt ?? item?.question ?? "").trim(),
        expectedConcepts: parseExpectedConcepts(item?.expectedConcepts),
        remediationTip:
          String(item?.remediationTip ?? item?.explanation ?? "").trim() ||
          "Review module concepts and try again.",
      }))
      .filter((question) => question.prompt.length > 0);

    if (questions.length === 0) return undefined;

    return {
      quizId: `module-quiz-${moduleOrder}`,
      title: `Module ${moduleOrder} Checkpoint`,
      questions,
    };
  } catch (error) {
    console.error("[generator] Failed to parse module quiz JSON:", error);
    return undefined;
  }
}

function parseLessonCitations(
  lessonContent: string,
  sourceLedger: SourceLedgerEntry[]
): Array<{
  citationText: string;
  sourceTitle: string;
  authors: string[];
  source: string;
  citationKey: string;
}> {
  const citationsMatch = lessonContent.match(
    /\*\*Citations\*\*:\s*([\s\S]*?)(?=\*\*Quiz\*\*:|\*\*Exercises\*\*:|###\s*Lesson|###\s*Module\s*\d+\s*Quiz|##\s*Module|$)/i
  );

  if (!citationsMatch) return [];

  const lines = citationsMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"));

  const refsByTitle = new Map<string, SourceLedgerEntry>(
    sourceLedger.map((source) => [source.title.toLowerCase(), source])
  );

  return lines
    .map((line) => {
      const sourceMatch = line.match(/\[Source:\s*"(.+?)"\]/i);
      const sourceTitle = sourceMatch ? sourceMatch[1].trim() : "";
      const citationText = line.replace(/^-+\s*/, "").trim();
      const sourceRef = sourceTitle
        ? refsByTitle.get(sourceTitle.toLowerCase()) ?? null
        : null;

      return {
        citationText,
        sourceTitle: sourceTitle || sourceRef?.title || "",
        authors: sourceRef?.authors ?? [],
        source: sourceRef?.source ?? "",
        citationKey: sourceTitle || sourceRef?.title || citationText.slice(0, 80),
      };
    })
    .filter((citation) => citation.citationText.length > 0);
}

function validateParsedCourse(
  parsedCourse: ParsedCourse,
  sourceLedger: SourceLedgerEntry[]
): ValidationResult {
  const issues: string[] = [];

  if (parsedCourse.modules.length === 0) {
    issues.push("No modules were generated.");
  }

  const sourceTitles = new Set(sourceLedger.map((source) => source.title.toLowerCase()));

  for (const module of parsedCourse.modules) {
    if (!module.moduleQuiz || module.moduleQuiz.questions.length === 0) {
      issues.push(`Module "${module.title}" is missing a module quiz.`);
    }

    for (const lesson of module.lessons) {
      const contentLength = normalizeWhitespace(lesson.content).length;
      if (contentLength < MIN_LESSON_CONTENT_CHARS) {
        issues.push(
          `Lesson "${lesson.title}" content is too short (${contentLength} chars).`
        );
      }

      const lessonQuizCount = lesson.quizzes?.[0]?.questions.length ?? 0;
      if (lessonQuizCount === 0) {
        issues.push(`Lesson "${lesson.title}" is missing a lesson quiz.`);
      }

      if ((lesson.videoSearchQueries?.length ?? 0) === 0) {
        issues.push(`Lesson "${lesson.title}" is missing YouTube search queries.`);
      }

      const citations = lesson.citations ?? [];
      if (citations.length === 0) {
        issues.push(`Lesson "${lesson.title}" is missing citations.`);
      } else if (sourceTitles.size > 0) {
        const hasMappedCitation = citations.some((citation) =>
          sourceTitles.has(citation.sourceTitle.toLowerCase())
        );
        if (!hasMappedCitation) {
          issues.push(
            `Lesson "${lesson.title}" citations are not mapped to discovered sources.`
          );
        }
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

function firstLessonId(modules: IModule[]): string {
  return modules[0]?.lessons[0]?.id ?? "";
}

function toCurriculum(modules: IModule[]) {
  return modules.map((module) => ({
    moduleId: module.id,
    order: module.order,
    title: module.title,
    moduleQuiz: module.moduleQuiz
      ? {
          quizId: module.moduleQuiz.quizId,
          title: module.moduleQuiz.title,
          questions: module.moduleQuiz.questions,
        }
      : undefined,
    lessons: module.lessons.map((lesson) => {
      const quizQuestions =
        lesson.quizzes?.[0]?.questions.map((question) => {
          const expectedText =
            question.correctAnswerText ||
            (typeof question.correctAnswerIndex === "number"
              ? question.options?.[question.correctAnswerIndex] ?? ""
              : "");
          return {
            questionId: question.id,
            prompt: question.question,
            expectedConcepts: expectedText ? [[String(expectedText)]] : [],
            remediationTip:
              question.explanation || "Review the lesson content and try again.",
          };
        }) ?? [];

      const videoReferences = Array.isArray(lesson.videoReferences)
        ? lesson.videoReferences
        : (lesson.videoLinks ?? []).map((url) => ({
            url,
            title: "",
            channelName: "",
            queryUsed: "",
          }));

      return {
        lessonId: lesson.id,
        order: lesson.order,
        title: lesson.title,
        summary: lesson.description,
        videoUrl: lesson.videoLinks?.[0] ?? "",
        videoReferences,
        contentMarkdown: lesson.content,
        citations: lesson.citations ?? [],
        quiz: quizQuestions,
      };
    }),
  }));
}

function createModuleCompleteEvent(index: number, title: string): StreamMilestoneEvent {
  return { type: "module_complete", data: { index, title } };
}

export function createStreamMilestoneState(): StreamMilestoneState {
  return {
    lineBuffer: "",
    courseTitle: null,
    modules: [],
    activeModuleIndex: null,
  };
}

function processCourseStreamLine(
  rawLine: string,
  state: StreamMilestoneState
): StreamMilestoneEvent[] {
  const events: StreamMilestoneEvent[] = [];
  const line = rawLine.replace(/\r$/, "").trim();

  if (!line) return events;

  const titleMatch = line.match(/^#\s*Course:\s*(.+)$/i);
  if (titleMatch && !state.courseTitle) {
    const title = titleMatch[1].trim();
    if (title) {
      state.courseTitle = title;
      events.push({ type: "course_title", data: { title } });
    }
  }

  const moduleMatch = line.match(/^##\s*Module\s*\d+\s*:\s*(.+)$/i);
  if (moduleMatch) {
    const moduleTitle = moduleMatch[1].trim();
    if (moduleTitle) {
      if (state.activeModuleIndex !== null) {
        const activeTitle = state.modules[state.activeModuleIndex];
        if (activeTitle) {
          events.push(createModuleCompleteEvent(state.activeModuleIndex, activeTitle));
        }
      }

      state.modules.push(moduleTitle);
      state.activeModuleIndex = state.modules.length - 1;
      events.push({
        type: "module_started",
        data: {
          index: state.activeModuleIndex,
          title: moduleTitle,
        },
      });
    }
  }

  return events;
}

export function consumeCourseStreamChunk(
  chunk: string,
  state: StreamMilestoneState
): StreamMilestoneEvent[] {
  const events: StreamMilestoneEvent[] = [];
  state.lineBuffer += chunk;

  const lines = state.lineBuffer.split("\n");
  state.lineBuffer = lines.pop() ?? "";

  for (const line of lines) {
    events.push(...processCourseStreamLine(line, state));
  }

  return events;
}

export function flushCourseStreamMilestones(
  state: StreamMilestoneState
): StreamMilestoneEvent[] {
  const events: StreamMilestoneEvent[] = [];

  if (state.lineBuffer.length > 0) {
    events.push(...processCourseStreamLine(state.lineBuffer, state));
    state.lineBuffer = "";
  }

  if (state.activeModuleIndex !== null) {
    const activeTitle = state.modules[state.activeModuleIndex];
    if (activeTitle) {
      events.push(createModuleCompleteEvent(state.activeModuleIndex, activeTitle));
    }
    state.activeModuleIndex = null;
  }

  return events;
}

function logMilestoneEvent(event: StreamMilestoneEvent): void {
  if (event.type === "course_title") {
    console.log(`[generator] Detected course title: "${event.data.title}"`);
    return;
  }

  if (event.type === "module_started") {
    console.log(
      `[generator] module_started index=${event.data.index} title="${event.data.title}"`
    );
    return;
  }

  console.log(
    `[generator] module_complete index=${event.data.index} title="${event.data.title}"`
  );
}

export async function* generate(
  conversationId: string,
  userId: string
): AsyncGenerator<SSEEvent> {
  console.log("[generator] Starting", { conversationId, userId });
  const conversation = await Conversation.findOne({
    _id: conversationId,
    userId: ensureObjectId(userId),
  });

  if (!conversation) {
    yield {
      type: "error",
      data: {
        code: "MCP_UNAVAILABLE",
        message: "Conversation not found",
        retryable: false,
        phase: "resource_retrieval",
      },
    };
    return;
  }

  if (conversation.phase !== "resource_retrieval") {
    console.log("[generator] Invalid phase", conversation.phase);
    yield {
      type: "error",
      data: {
        code: "MCP_UNAVAILABLE",
        message: `Invalid conversation phase: ${conversation.phase}. Expected: resource_retrieval`,
        retryable: false,
        phase: "resource_retrieval",
      },
    };
    return;
  }

  const onboardingData: OnboardingData = {
    topic: conversation.onboardingData.topic,
    level: conversation.onboardingData.level,
    hoursPerWeek: conversation.onboardingData.hoursPerWeek,
    goal: conversation.onboardingData.goal,
    confirmedSubject: conversation.onboardingData.confirmedSubject,
  };

  conversation.phase = "course_generation";
  await conversation.save();
  console.log("[generator] Phase updated to course_generation");

  let course: InstanceType<typeof Course> | null = null;

  try {
    const owner = await User.findById(userId).select("name");
    const ownerName = owner?.name ?? "Course Creator";

    course = new Course({
      userId: ensureObjectId(userId),
      ownerId: ensureObjectId(userId),
      ownerName,
      conversationId: ensureObjectId(conversationId),
      title: onboardingData.confirmedSubject || onboardingData.topic || "New Course",
      description: "",
      subject: onboardingData.confirmedSubject || onboardingData.topic || "",
      topic: onboardingData.topic || onboardingData.confirmedSubject || "",
      goal: onboardingData.goal || "",
      level: onboardingData.level || "beginner",
      status: "generating",
      visibility: "draft",
      accessModel: "free_hackathon",
      generationStatus: "pending",
      createdBy: "generator",
      modules: [],
      curriculum: [],
      sourceReferences: [],
      estimatedHours: 0,
      resources: [],
      progress: {
        completedLessons: 0,
        totalLessons: 0,
        percentComplete: 0,
      },
    });
    await course.save();

    yield {
      type: "status",
      data: {
        phase: "course_generation",
        message: "AI is searching for resources...",
        progress: 10,
      },
    };

    const sourceRefs = new Map<string, SourceLedgerEntry>();
    let courseContent = "";
    const milestoneState = createStreamMilestoneState();

    for await (const event of streamCourseWithMCPTools(
      onboardingData,
      course._id.toString(),
      userId
    )) {
      if (event.type === "tool_call") {
        console.log(
          `[generator] tool_call ${event.data.toolName} id=${event.data.toolCallId}`
        );
      }

      if (event.type === "tool_result") {
        console.log(
          `[generator] tool_result ${event.data.toolName} id=${event.data.toolCallId} summary="${event.data.summary}"`
        );

        const refs = uniqueSourceRefs(event.data.resourceRefs ?? []);
        for (const ref of refs) {
          sourceRefs.set(ref.title.toLowerCase(), ref);
        }
      }

      if (event.type === "course_chunk") {
        const chunk = String(event.data.content ?? "");
        courseContent += chunk;
        const milestoneEvents = consumeCourseStreamChunk(chunk, milestoneState);
        for (const milestone of milestoneEvents) {
          logMilestoneEvent(milestone);
          yield milestone;
        }
      }

      yield event;
    }

    const finalMilestoneEvents = flushCourseStreamMilestones(milestoneState);
    for (const milestone of finalMilestoneEvents) {
      logMilestoneEvent(milestone);
      yield milestone;
    }

    console.log("[generator] Stream complete", {
      contentLength: courseContent.length,
      sourceRefCount: sourceRefs.size,
    });

    yield {
      type: "status",
      data: {
        phase: "course_generation",
        message: "Validating course quality...",
        progress: 92,
      },
    };

    let workingMarkdown = courseContent;
    let parsedCourse: ParsedCourse | null = null;
    const sourceLedger = [...sourceRefs.values()];

    for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
      const candidate = parseCourseContent(workingMarkdown, sourceLedger);
      const validation = validateParsedCourse(candidate, sourceLedger);

      if (validation.valid) {
        parsedCourse = candidate;
        break;
      }

      console.log(
        `[generator] Validation failed attempt=${attempt + 1} issues=${validation.issues.join(
          " | "
        )}`
      );

      if (attempt === MAX_REPAIR_ATTEMPTS) {
        throw new Error(
          `Course validation failed: ${validation.issues.slice(0, 3).join(" | ")}`
        );
      }

      yield {
        type: "status",
        data: {
          phase: "course_generation",
          message: `Repairing course structure (${attempt + 1}/${
            MAX_REPAIR_ATTEMPTS + 1
          })...`,
          progress: 94,
        },
      };

      workingMarkdown = await repairGeneratedCourseMarkdown({
        markdown: workingMarkdown,
        issues: validation.issues,
        sourceRefs: sourceLedger,
        onboardingData,
      });
    }

    if (!parsedCourse) {
      throw new Error("Course could not be validated.");
    }

    yield {
      type: "status",
      data: {
        phase: "course_generation",
        message: "Fetching YouTube video references...",
        progress: 97,
      },
    };

    for (const module of parsedCourse.modules) {
      for (const lesson of module.lessons) {
        const fallbackQuery = `${lesson.title} ${
          onboardingData.confirmedSubject || onboardingData.topic || ""
        } tutorial`;
        const queries =
          lesson.videoSearchQueries && lesson.videoSearchQueries.length > 0
            ? lesson.videoSearchQueries
            : [fallbackQuery.trim()];

        const references = await fetchVideoReferencesForQueries(queries);
        if (references.length === 0) {
          throw new Error(
            `No YouTube references were found for lesson "${lesson.title}". Check YOUTUBE_API_KEY.`
          );
        }

        lesson.videoSearchQueries = queries;
        lesson.videoLinks = references.map((ref) => ref.url);
        lesson.videoReferences = references.map((ref: YouTubeVideoReference) => ({
          url: ref.url,
          title: ref.title,
          channelName: ref.channelName,
          queryUsed: ref.queryUsed,
        }));

        if (!lesson.citations || lesson.citations.length === 0) {
          if (sourceLedger.length === 0) {
            throw new Error(
              `Lesson "${lesson.title}" has no citations and no source references are available.`
            );
          }
          lesson.citations = [toFallbackCitation(sourceLedger[0])];
        }
      }
    }

    const curriculum = toCurriculum(parsedCourse.modules);
    course.title = parsedCourse.title || course.title;
    course.description = parsedCourse.description;
    course.modules = parsedCourse.modules;
    course.curriculum = curriculum;
    course.topic = onboardingData.topic || course.topic;
    course.goal = onboardingData.goal || course.goal;
    course.sourceReferences = sourceLedger as ISourceReference[];
    course.estimatedHours = parsedCourse.estimatedHours;
    course.status = "active";
    course.generationStatus = "ready";
    course.progress.totalLessons = parsedCourse.totalLessons;
    await course.save();

    const firstLesson = firstLessonId(parsedCourse.modules);
    if (firstLesson) {
      const existingEnrollment = await Enrollment.findOne({
        userId: ensureObjectId(userId),
        courseId: course._id,
      });
      if (!existingEnrollment) {
        await Enrollment.create({
          userId: ensureObjectId(userId),
          courseId: course._id,
          status: "active",
          progressPercent: 0,
          currentLessonId: firstLesson,
          completedLessonIds: [],
        });
      } else if (!existingEnrollment.currentLessonId) {
        existingEnrollment.currentLessonId = firstLesson;
        await existingEnrollment.save();
      }
    }

    conversation.phase = "completed";
    conversation.status = "completed";
    conversation.courseId = course._id;
    await conversation.save();

    const completionData = {
      courseId: course._id.toString(),
      title: course.title,
      description: course.description,
      moduleCount: course.modules.length,
      lessonCount: parsedCourse.totalLessons,
      estimatedHours: course.estimatedHours,
    };

    console.log("[generator] Completed", completionData);

    yield {
      type: "complete",
      data: completionData,
    };
  } catch (error) {
    console.error("[generator] Generation error", error);

    conversation.phase = "resource_retrieval";
    await conversation.save();

    if (course) {
      course.generationStatus = "failed";
      await course.save();
    }

    yield {
      type: "error",
      data: {
        code: "AI_ERROR",
        message: error instanceof Error ? error.message : "Course generation failed",
        retryable: true,
        phase: "course_generation",
      },
    };
  }
}

export function parseCourseContent(
  content: string,
  sourceLedger: SourceLedgerEntry[] = []
): ParsedCourse {
  const result: ParsedCourse = {
    title: "",
    description: "",
    modules: [],
    totalLessons: 0,
    estimatedHours: 0,
  };

  const normalized = content.replace(/\r/g, "");
  const titleMatch = normalized.match(/^#\s*Course:\s*(.+)$/m);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }

  const descMatch = normalized.match(
    /##\s*Description\s*\n([\s\S]*?)(?=##\s*Module|\n##|$)/
  );
  if (descMatch) {
    result.description = normalizeWhitespace(descMatch[1]);
  }

  const moduleRegex = /##\s*Module\s*(\d+):\s*(.+)\n([\s\S]*?)(?=##\s*Module\s*\d+:|$)/g;
  let moduleMatch: RegExpExecArray | null;

  while ((moduleMatch = moduleRegex.exec(normalized)) !== null) {
    const moduleOrder = Number(moduleMatch[1]);
    const moduleTitle = moduleMatch[2].trim();
    const moduleContent = moduleMatch[3];

    const moduleDescMatch = moduleContent.match(/^([\s\S]*?)(?=###\s*Lesson)/);
    const moduleDescription = moduleDescMatch
      ? normalizeWhitespace(moduleDescMatch[1])
      : "";

    const moduleQuizMatch = moduleContent.match(
      /###\s*Module\s*\d+\s*Quiz[\s\S]*?\*\*Module Quiz\*\*:\s*```(?:json)?\s*([\s\S]*?)\s*```/i
    );
    const moduleQuiz = moduleQuizMatch
      ? parseModuleQuiz(moduleQuizMatch[1], moduleOrder)
      : undefined;

    const module: IModule = {
      id: randomUUID(),
      title: moduleTitle,
      description: moduleDescription,
      order: Number.isFinite(moduleOrder) ? moduleOrder : result.modules.length + 1,
      completed: false,
      moduleQuiz,
      lessons: [],
    };

    const lessonRegex =
      /###\s*Lesson\s*[\d.]+:\s*(.+)\n([\s\S]*?)(?=###\s*Lesson|###\s*Module\s*\d+\s*Quiz|##\s*Module|$)/g;
    let lessonMatch: RegExpExecArray | null;
    let lessonOrder = 1;

    while ((lessonMatch = lessonRegex.exec(moduleContent)) !== null) {
      const lessonTitle = lessonMatch[1].trim();
      const lessonContent = lessonMatch[2];

      const timeMatch = lessonContent.match(/\*\*Estimated Time\*\*:\s*(\d+)\s*minutes?/i);
      const estimatedMinutes = timeMatch ? parseInt(timeMatch[1], 10) : 20;

      const descLineMatch = lessonContent.match(/\*\*Description\*\*:\s*(.+)/);
      const lessonDescription = descLineMatch ? descLineMatch[1].trim() : "";

      const contentMatch = lessonContent.match(
        /\*\*Content\*\*:\s*([\s\S]*?)(?=\*\*Key Takeaways\*\*:|\*\*Videos\*\*:|\*\*Citations\*\*:|\*\*Quiz\*\*:|\*\*Exercises\*\*:|$)/i
      );
      const mainContent = normalizeWhitespace(
        contentMatch ? contentMatch[1] : lessonContent
      );

      const videoSearchQueries: string[] = [];
      const videosSectionMatch = lessonContent.match(
        /\*\*Videos\*\*:\s*([\s\S]*?)(?=\*\*Citations\*\*:|\*\*Quiz\*\*:|\*\*Exercises\*\*:|$)/i
      );
      if (videosSectionMatch) {
        const searchRegex = /\[Search:\s*"(.*?)"\]/g;
        let searchMatch: RegExpExecArray | null;
        while ((searchMatch = searchRegex.exec(videosSectionMatch[1])) !== null) {
          const query = searchMatch[1].trim();
          if (query) {
            videoSearchQueries.push(query);
          }
        }
      }

      const citations = parseLessonCitations(lessonContent, sourceLedger);
      const quizSectionMatch = lessonContent.match(
        /\*\*Quiz\*\*:\s*```(?:json)?\s*([\s\S]*?)\s*```/i
      );
      const quizzes = quizSectionMatch ? parseLessonQuiz(quizSectionMatch[1]) : [];

      const interactiveElements: InteractiveElement[] = [];
      const exercisesSectionMatch = lessonContent.match(
        /\*\*Exercises\*\*:\s*([\s\S]*?)(?=(?:###|##|$))/i
      );
      if (exercisesSectionMatch) {
        const exercisesContent = normalizeWhitespace(exercisesSectionMatch[1]);
        if (exercisesContent) {
          interactiveElements.push({
            id: randomUUID(),
            type: "exercise",
            content: exercisesContent,
            isCompleted: false,
          });
        }
      }

      const lesson: ILesson = {
        id: randomUUID(),
        title: lessonTitle,
        description: lessonDescription,
        content: mainContent,
        estimatedMinutes,
        videoLinks: [],
        videoSearchQueries,
        videoReferences: [],
        citations,
        quizzes,
        interactiveElements,
        resources: [],
        completed: false,
        order: lessonOrder,
      };

      lessonOrder += 1;
      module.lessons.push(lesson);
      result.totalLessons += 1;
      result.estimatedHours += estimatedMinutes / 60;
    }

    result.modules.push(module);
  }

  result.estimatedHours = Math.round(result.estimatedHours * 10) / 10;
  return result;
}
