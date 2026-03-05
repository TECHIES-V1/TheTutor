export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface OnboardingPayload {
  topic: string;
  level: CourseLevel;
  hoursPerWeek: number;
  goal: string;
}

export interface GeneratedQuizQuestion {
  questionId: string;
  prompt: string;
  expectedConcepts: string[][];
  remediationTip: string;
}

export interface GeneratedVideoReference {
  url: string;
  title: string;
  channelName: string;
  queryUsed: string;
}

export interface GeneratedCitation {
  citationText: string;
  sourceTitle: string;
  authors: string[];
  source: string;
  citationKey: string;
}

export interface GeneratedModuleQuiz {
  quizId: string;
  title: string;
  questions: GeneratedQuizQuestion[];
}

export interface GeneratedLesson {
  lessonId: string;
  order: number;
  title: string;
  summary: string;
  videoUrl: string;
  videoReferences: GeneratedVideoReference[];
  contentMarkdown: string;
  citations: GeneratedCitation[];
  quiz: GeneratedQuizQuestion[];
}

export interface GeneratedModule {
  moduleId: string;
  order: number;
  title: string;
  moduleQuiz?: GeneratedModuleQuiz;
  lessons: GeneratedLesson[];
}

export interface GeneratedCoursePayload {
  title: string;
  description: string;
  topic: string;
  level: CourseLevel;
  goal: string;
  curriculum: GeneratedModule[];
}
