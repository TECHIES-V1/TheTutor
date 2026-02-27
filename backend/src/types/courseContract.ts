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

export interface GeneratedLesson {
  lessonId: string;
  order: number;
  title: string;
  summary: string;
  videoUrl: string;
  contentMarkdown: string;
  quiz: GeneratedQuizQuestion[];
}

export interface GeneratedModule {
  moduleId: string;
  order: number;
  title: string;
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

