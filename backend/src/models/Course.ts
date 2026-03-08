import mongoose, { Document, Schema, Types } from "mongoose";
import type {
  ExperienceLevel,
  CourseStatus,
  LessonResource,
  QuizQuestion,
  Quiz,
  InteractiveElement,
} from "../types";

export interface IVideoReference {
  url: string;
  title: string;
  channelName: string;
  queryUsed: string;
}

export interface ILessonCitation {
  citationText: string;
  sourceTitle: string;
  authors: string[];
  source: string;
  citationKey: string;
}

export interface IModuleQuizQuestion {
  questionId: string;
  prompt: string;
  expectedConcepts: string[][];
  remediationTip: string;
}

export interface IModuleQuiz {
  quizId: string;
  title: string;
  questions: IModuleQuizQuestion[];
}

export interface ISourceReference {
  title: string;
  authors: string[];
  source: string;
}

export interface IGeneratedLesson {
  lessonId: string;
  order: number;
  title: string;
  summary: string;
  status: "pending" | "ready";
  bloomsLevel?: number;
  bloomsVerb?: string;
  estimatedMinutes: number;
  videoUrl: string;
  videoReferences: IVideoReference[];
  videoSearchQueries?: string[];
  contentMarkdown: string;
  keyTakeaways: string[];
  citations: ILessonCitation[];
  quiz: IModuleQuizQuestion[];
  exercises: string[];
}

export interface IGeneratedModule {
  moduleId: string;
  order: number;
  title: string;
  description: string;
  bloomsRange?: [number, number];
  moduleQuiz?: IModuleQuiz;
  lessons: IGeneratedLesson[];
}

export interface ILesson {
  id: string;
  title: string;
  description: string;
  content: string;
  estimatedMinutes: number;
  videoLinks?: string[];
  videoSearchQueries?: string[];
  videoReferences?: IVideoReference[];
  citations?: ILessonCitation[];
  resources?: LessonResource[];
  quizzes?: Quiz[];
  interactiveElements?: InteractiveElement[];
  completed: boolean;
  order: number;
}

export interface IModule {
  id: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
  moduleQuiz?: IModuleQuiz;
  lessons: ILesson[];
}

export interface ICourse extends Document {
  userId: Types.ObjectId;
  ownerId?: Types.ObjectId;
  ownerName?: string;
  conversationId?: Types.ObjectId;
  generationJobId?: Types.ObjectId;
  title: string;
  slug?: string;
  description: string;
  subject: string;
  topic?: string;
  goal?: string;
  visibility?: "draft" | "published";
  accessModel?: string;
  generationStatus?: "pending" | "ready" | "failed";
  createdBy?: string;
  curriculum?: IGeneratedModule[];
  sourceReferences?: ISourceReference[];
  level: ExperienceLevel;
  status: CourseStatus;
  modules: IModule[];
  estimatedHours: number;
  resources: Types.ObjectId[]; // References to Resource documents
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentComplete: number;
    lastAccessedAt?: Date;
  };
  viewCount: number;
  enrollmentCount: number;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LessonResourceSchema = new Schema<LessonResource>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ["article", "video", "book", "exercise"],
      required: true,
    },
  },
  { _id: false }
);

const QuizQuestionSchema = new Schema<QuizQuestion>(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["multiple_choice", "open_ended"], required: true },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswerIndex: { type: Number },
    correctAnswerText: { type: String },
    explanation: { type: String, required: true },
    isAnsweredCorrectly: { type: Boolean, default: false },
  },
  { _id: false }
);

const QuizSchema = new Schema<Quiz>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    questions: { type: [QuizQuestionSchema], default: [] },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const InteractiveElementSchema = new Schema<InteractiveElement>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    metadata: { type: Map, of: Schema.Types.Mixed },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const GeneratedQuizQuestionSchema = new Schema<IModuleQuizQuestion>(
  {
    questionId: { type: String, required: true },
    prompt: { type: String, required: true },
    expectedConcepts: { type: [[String]], default: [] },
    remediationTip: { type: String, required: true },
  },
  { _id: false }
);

const VideoReferenceSchema = new Schema<IVideoReference>(
  {
    url: { type: String, required: true },
    title: { type: String, default: "" },
    channelName: { type: String, default: "" },
    queryUsed: { type: String, default: "" },
  },
  { _id: false }
);

const LessonCitationSchema = new Schema<ILessonCitation>(
  {
    citationText: { type: String, required: true },
    sourceTitle: { type: String, required: true },
    authors: { type: [String], default: [] },
    source: { type: String, default: "" },
    citationKey: { type: String, required: true },
  },
  { _id: false }
);

const ModuleQuizSchema = new Schema<IModuleQuiz>(
  {
    quizId: { type: String, required: true },
    title: { type: String, required: true },
    questions: { type: [GeneratedQuizQuestionSchema], default: [] },
  },
  { _id: false }
);

const SourceReferenceSchema = new Schema<ISourceReference>(
  {
    title: { type: String, required: true },
    authors: { type: [String], default: [] },
    source: { type: String, default: "" },
  },
  { _id: false }
);

const GeneratedLessonSchema = new Schema<IGeneratedLesson>(
  {
    lessonId: { type: String, required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    status: { type: String, enum: ["pending", "ready"], default: "pending" },
    bloomsLevel: { type: Number, min: 1, max: 6 },
    bloomsVerb: { type: String, default: "" },
    estimatedMinutes: { type: Number, default: 20 },
    videoUrl: { type: String, default: "" },
    videoReferences: { type: [VideoReferenceSchema], default: [] },
    videoSearchQueries: { type: [String], default: [] },
    contentMarkdown: { type: String, default: "" },
    keyTakeaways: { type: [String], default: [] },
    citations: { type: [LessonCitationSchema], default: [] },
    quiz: { type: [GeneratedQuizQuestionSchema], default: [] },
    exercises: { type: [String], default: [] },
  },
  { _id: false }
);

const GeneratedModuleSchema = new Schema<IGeneratedModule>(
  {
    moduleId: { type: String, required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    bloomsRange: { type: [Number], default: undefined },
    moduleQuiz: { type: ModuleQuizSchema, required: false },
    lessons: { type: [GeneratedLessonSchema], default: [] },
  },
  { _id: false }
);

const LessonSchema = new Schema<ILesson>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    content: { type: String, required: true },
    estimatedMinutes: { type: Number, default: 15 },
    videoLinks: { type: [String], default: [] },
    videoSearchQueries: { type: [String], default: [] },
    videoReferences: { type: [VideoReferenceSchema], default: [] },
    citations: { type: [LessonCitationSchema], default: [] },
    resources: { type: [LessonResourceSchema], default: [] },
    quizzes: { type: [QuizSchema], default: [] },
    interactiveElements: { type: [InteractiveElementSchema], default: [] },
    completed: { type: Boolean, default: false },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const ModuleSchema = new Schema<IModule>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    moduleQuiz: { type: ModuleQuizSchema, required: false },
    lessons: { type: [LessonSchema], default: [] },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    ownerName: { type: String, default: "" },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: false,
    },
    generationJobId: {
      type: Schema.Types.ObjectId,
      ref: "GenerationJob",
      required: false,
    },
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String, default: "" },
    subject: { type: String, required: true },
    topic: { type: String, default: "" },
    goal: { type: String, default: "" },
    visibility: { type: String, enum: ["draft", "published"], default: "draft" },
    accessModel: { type: String, default: "free_hackathon" },
    generationStatus: {
      type: String,
      enum: ["pending", "ready", "failed"],
      default: "pending",
    },
    createdBy: { type: String, default: "generator" },
    curriculum: { type: [GeneratedModuleSchema], default: [] },
    sourceReferences: { type: [SourceReferenceSchema], default: [] },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    status: {
      type: String,
      enum: ["generating", "active", "completed", "archived"],
      default: "generating",
    },
    modules: { type: [ModuleSchema], default: [] },
    estimatedHours: { type: Number, default: 0 },
    resources: [{ type: Schema.Types.ObjectId, ref: "Resource" }],
    progress: {
      completedLessons: { type: Number, default: 0 },
      totalLessons: { type: Number, default: 0 },
      percentComplete: { type: Number, default: 0 },
      lastAccessedAt: Date,
    },
    viewCount: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for finding courses by user
CourseSchema.index({ userId: 1, status: 1 });
CourseSchema.index({ ownerId: 1, visibility: 1 });
CourseSchema.index({ conversationId: 1 });
CourseSchema.index({ generationJobId: 1 });
CourseSchema.index({ userId: 1, updatedAt: -1 });
CourseSchema.index({ title: "text", subject: "text", topic: "text", description: "text" });

export const Course = mongoose.model<ICourse>("Course", CourseSchema);
