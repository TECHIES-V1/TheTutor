export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseVisibility = "draft" | "published";
export type EnrollmentStatus = "active" | "completed";

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  topic: string;
  level: CourseLevel;
  goal: string;
  ownerName: string;
  author: {
    id: string | null;
    name: string;
  };
  sourceAttribution: Array<{
    title: string;
    authors: string[];
    source: string;
  }>;
  visibility: CourseVisibility;
  accessModel: "free_hackathon";
  moduleCount: number;
  lessonCount: number;
  enrollment: {
    status: EnrollmentStatus;
    progressPercent: number;
    currentLessonId: string;
    completedLessonCount: number;
  } | null;
}

export interface CurriculumOutline {
  moduleId: string;
  title: string;
  order: number;
  moduleQuiz?: {
    quizId: string;
    title: string;
    questionCount: number;
  } | null;
  lessons: {
    lessonId: string;
    title: string;
    order: number;
    summary: string;
  }[];
}

export interface CoursePreviewResponse {
  course: CourseSummary;
  curriculumOutline: CurriculumOutline[];
  access: {
    isOwner: boolean;
    isEnrolled: boolean;
    canEnroll: boolean;
    requiresAuthToEnroll?: boolean;
  };
}

export interface DashboardCourseCard {
  id: string;
  title: string;
  description: string;
  topic: string;
  level: CourseLevel;
  ownerName: string;
  author: {
    id: string | null;
    name: string;
  };
  sourceAttribution: Array<{
    title: string;
    authors: string[];
    source: string;
  }>;
  visibility: CourseVisibility;
  role: "owner" | "learner";
  lessonCount: number;
  progressPercent: number;
  currentLessonId: string | null;
  currentLessonTitle: string | null;
  status: EnrollmentStatus;
  completed: boolean;
  certificateAvailable: boolean;
  updatedAt: string;
}

export interface DashboardOverview {
  greetingName: string;
  stats: {
    ownedCourses: number;
    enrolledCourses: number;
    completedCourses: number;
    hoursLearned: number;
    totalLessonsAcrossCourses: number;
  };
  ownedCourses: DashboardCourseCard[];
  enrolledCourses: DashboardCourseCard[];
}

export interface LessonDetailResponse {
  course: {
    id: string;
    title: string;
    description: string;
  };
  lesson: {
    lessonId: string;
    title: string;
    summary: string;
    videoUrl: string;
    videoReferences: Array<{
      url: string;
      title: string;
      channelName: string;
      queryUsed: string;
    }>;
    contentMarkdown: string;
    citations: Array<{
      citationText: string;
      sourceTitle: string;
      authors: string[];
      source: string;
      citationKey: string;
    }>;
    quiz: {
      questionId: string;
      prompt: string;
    }[];
    moduleQuiz: {
      quizId: string;
      title: string;
      questions: Array<{
        questionId: string;
        prompt: string;
      }>;
    } | null;
  };
  navigation: {
    previousLessonId: string | null;
    nextLessonId: string | null;
    isFinalLesson: boolean;
    isLastLessonInModule: boolean;
    moduleId: string;
  };
  progress: {
    status: EnrollmentStatus;
    progressPercent: number;
    completedLessonIds: string[];
    currentLessonId: string;
  } | null;
}

export interface QuizAttemptResult {
  attemptId: string;
  attemptNumber: number;
  score: number;
  passThreshold: number;
  passed: boolean;
  feedback: {
    questionId: string;
    score: number;
    missingConcepts: string[];
    correctiveFeedback: string;
  }[];
  lessonCompleted: boolean;
  nextLessonId: string | null;
  courseReadyToComplete: boolean;
  progressPercent: number;
}

export interface CertificateSummary {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  fileName: string;
  downloadUrl: string;
}

export interface ModuleQuizResponse {
  moduleId: string;
  title: string;
  questions: Array<{
    questionId: string;
    prompt: string;
  }>;
}

export interface ModuleQuizAttemptResult {
  score: number;
  passThreshold: number;
  passed: boolean;
  moduleCompleted: boolean;
  feedback: Array<{
    questionId: string;
    score: number;
    missingConcepts: string[];
    correctiveFeedback: string;
  }>;
}
