import { ICourse, ILesson } from "../models/Course";

interface NormalizedQuizQuestion {
  questionId: string;
  prompt: string;
  expectedConcepts: string[][];
  remediationTip: string;
}

type RuntimeLesson = ILesson & {
  lessonId: string;
  summary: string;
  videoUrl: string;
  videoReferences: Array<{
    url: string;
    title: string;
    channelName: string;
    queryUsed: string;
  }>;
  citations: Array<{
    citationText: string;
    sourceTitle: string;
    authors: string[];
    source: string;
    citationKey: string;
  }>;
  contentMarkdown: string;
  quiz: NormalizedQuizQuestion[];
};

export interface LessonWithModule {
  moduleId: string;
  moduleTitle: string;
  lesson: RuntimeLesson;
}

function getCourseField(course: ICourse, path: string): unknown {
  const doc = course as unknown as {
    get?: (field: string) => unknown;
    [key: string]: unknown;
  };

  if (typeof doc.get === "function") {
    const value = doc.get(path);
    if (value !== undefined) return value;
  }

  return doc[path];
}

function getModuleOrder(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toExpectedConceptGroups(rawQuestion: any): string[][] {
  if (Array.isArray(rawQuestion?.expectedConcepts)) {
    return rawQuestion.expectedConcepts
      .map((group: unknown) =>
        Array.isArray(group)
          ? group.map((value) => String(value)).filter(Boolean)
          : []
      )
      .filter((group: string[]) => group.length > 0);
  }

  let canonicalAnswer = "";
  if (
    rawQuestion?.type === "multiple_choice" &&
    Array.isArray(rawQuestion?.options) &&
    Number.isInteger(rawQuestion?.correctAnswerIndex)
  ) {
    canonicalAnswer =
      String(rawQuestion.options[rawQuestion.correctAnswerIndex] ?? "").trim();
  } else {
    canonicalAnswer = String(rawQuestion?.correctAnswerText ?? "").trim();
  }

  return canonicalAnswer ? [[canonicalAnswer]] : [];
}

function toNormalizedQuizQuestions(rawLesson: any): NormalizedQuizQuestion[] {
  const modernQuiz = Array.isArray(rawLesson?.quiz) ? rawLesson.quiz : null;
  if (modernQuiz) {
    return modernQuiz.map((question: any, index: number) => ({
      questionId: String(question?.questionId ?? `q-${index + 1}`),
      prompt: String(question?.prompt ?? ""),
      expectedConcepts: toExpectedConceptGroups(question),
      remediationTip: String(
        question?.remediationTip ?? "Review the lesson content and try again."
      ),
    }));
  }

  const legacyQuestions =
    Array.isArray(rawLesson?.quizzes) && rawLesson.quizzes.length > 0
      ? rawLesson.quizzes[0]?.questions
      : null;

  if (!Array.isArray(legacyQuestions)) {
    return [];
  }

  return legacyQuestions.map((question: any, index: number) => ({
    questionId: String(question?.id ?? `q-${index + 1}`),
    prompt: String(question?.question ?? ""),
    expectedConcepts: toExpectedConceptGroups(question),
    remediationTip: String(
      question?.explanation ?? "Review the lesson content and try again."
    ),
  }));
}

function normalizeLesson(rawLesson: any, fallbackId: string): RuntimeLesson {
  const lessonId = String(rawLesson?.lessonId ?? rawLesson?.id ?? fallbackId);
  const summary = String(rawLesson?.summary ?? rawLesson?.description ?? "");
  const contentMarkdown = String(
    rawLesson?.contentMarkdown ?? rawLesson?.content ?? ""
  );
  const explicitVideoReferences = Array.isArray(rawLesson?.videoReferences)
    ? rawLesson.videoReferences
        .map((item: any) => ({
          url: String(item?.url ?? "").trim(),
          title: String(item?.title ?? "").trim(),
          channelName: String(item?.channelName ?? "").trim(),
          queryUsed: String(item?.queryUsed ?? "").trim(),
        }))
        .filter((item: { url: string }) => item.url.length > 0)
    : [];
  const videoUrl =
    (explicitVideoReferences[0]?.url ?? "").trim() ||
    String(rawLesson?.videoUrl ?? "").trim() ||
    (Array.isArray(rawLesson?.videoLinks) && rawLesson.videoLinks.length > 0
      ? String(rawLesson.videoLinks[0] ?? "")
      : "");

  const legacyVideoLinks = Array.isArray(rawLesson?.videoLinks)
    ? rawLesson.videoLinks.map((item: unknown) => String(item))
    : [];
  const videoLinks =
    legacyVideoLinks.length > 0 ? legacyVideoLinks : videoUrl ? [videoUrl] : [];
  const videoReferences =
    explicitVideoReferences.length > 0
      ? explicitVideoReferences
      : videoLinks.map((url: string) => ({
          url,
          title: "",
          channelName: "",
          queryUsed: "",
        }));

  const citations = Array.isArray(rawLesson?.citations)
    ? rawLesson.citations.map((item: any) => ({
        citationText: String(item?.citationText ?? "").trim(),
        sourceTitle: String(item?.sourceTitle ?? "").trim(),
        authors: Array.isArray(item?.authors)
          ? item.authors.map((author: unknown) => String(author)).filter(Boolean)
          : [],
        source: String(item?.source ?? "").trim(),
        citationKey: String(item?.citationKey ?? item?.sourceTitle ?? "").trim(),
      }))
    : [];

  return {
    id: lessonId,
    lessonId,
    title: String(rawLesson?.title ?? "Untitled Lesson"),
    description: String(rawLesson?.description ?? summary),
    summary,
    content: String(rawLesson?.content ?? contentMarkdown),
    contentMarkdown,
    estimatedMinutes: Number(rawLesson?.estimatedMinutes ?? 15),
    videoLinks,
    videoSearchQueries: Array.isArray(rawLesson?.videoSearchQueries)
      ? rawLesson.videoSearchQueries.map((item: unknown) => String(item))
      : [],
    videoUrl,
    videoReferences,
    citations,
    resources: Array.isArray(rawLesson?.resources) ? rawLesson.resources : [],
    quizzes: Array.isArray(rawLesson?.quizzes) ? rawLesson.quizzes : [],
    quiz: toNormalizedQuizQuestions(rawLesson),
    interactiveElements: Array.isArray(rawLesson?.interactiveElements)
      ? rawLesson.interactiveElements
      : [],
    completed: Boolean(rawLesson?.completed),
    order: Number(rawLesson?.order ?? 0),
  };
}

function getRawModules(course: ICourse): any[] {
  const curriculum = getCourseField(course, "curriculum");
  if (Array.isArray(curriculum) && curriculum.length > 0) {
    return curriculum;
  }

  const modules = getCourseField(course, "modules");
  if (Array.isArray(modules)) {
    return modules;
  }

  return [];
}

export function flattenLessons(course: ICourse): LessonWithModule[] {
  const rawModules = getRawModules(course);
  const modules = [...rawModules].sort(
    (a: any, b: any) => getModuleOrder(a?.order, 0) - getModuleOrder(b?.order, 0)
  );

  const flattened: LessonWithModule[] = [];

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
    const module = modules[moduleIndex];
    const moduleId = String(module?.moduleId ?? module?.id ?? `module-${moduleIndex + 1}`);
    const moduleTitle = String(module?.title ?? `Module ${moduleIndex + 1}`);
    const lessons = Array.isArray(module?.lessons) ? [...module.lessons] : [];
    lessons.sort(
      (a: any, b: any) => getModuleOrder(a?.order, 0) - getModuleOrder(b?.order, 0)
    );

    for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
      const rawLesson = lessons[lessonIndex];
      const normalized = normalizeLesson(
        rawLesson,
        `lesson-${moduleIndex + 1}-${lessonIndex + 1}`
      );
      flattened.push({
        moduleId,
        moduleTitle,
        lesson: normalized,
      });
    }
  }

  return flattened;
}

export function findLessonById(course: ICourse, lessonId: string): LessonWithModule | null {
  const all = flattenLessons(course);
  return all.find((item) => item.lesson.lessonId === lessonId) ?? null;
}

export function findLessonOrder(course: ICourse, lessonId: string): number {
  const all = flattenLessons(course);
  return all.findIndex((item) => item.lesson.lessonId === lessonId);
}

export function getNextLessonId(course: ICourse, lessonId: string): string | null {
  const all = flattenLessons(course);
  const index = all.findIndex((item) => item.lesson.lessonId === lessonId);
  if (index === -1 || index + 1 >= all.length) return null;
  return all[index + 1].lesson.lessonId;
}

export function getLessonTitleById(course: ICourse, lessonId: string): string | null {
  const found = findLessonById(course, lessonId);
  return found?.lesson.title ?? null;
}

export function getTotalLessonCount(course: ICourse): number {
  return flattenLessons(course).length;
}

export function computeProgressPercent(completedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((completedCount / totalCount) * 100);
}
