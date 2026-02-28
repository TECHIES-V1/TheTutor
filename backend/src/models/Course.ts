import mongoose, { Document, Schema, Types } from "mongoose";
import type {
  ExperienceLevel,
  CourseStatus,
  LessonResource,
  QuizQuestion,
  Quiz,
  InteractiveElement,
} from "../types";

export interface ILesson {
  id: string;
  title: string;
  description: string;
  content: string;
  estimatedMinutes: number;
  videoLinks?: string[];
  videoSearchQueries?: string[];
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
  lessons: ILesson[];
}

export interface ICourse extends Document {
  userId: Types.ObjectId;
  conversationId: Types.ObjectId;
  title: string;
  description: string;
  subject: string;
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

const LessonSchema = new Schema<ILesson>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    content: { type: String, required: true },
    estimatedMinutes: { type: Number, default: 15 },
    videoLinks: { type: [String], default: [] },
    videoSearchQueries: { type: [String], default: [] },
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
    lessons: { type: [LessonSchema], default: [] },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    subject: { type: String, required: true },
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
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for finding courses by user
CourseSchema.index({ userId: 1, status: 1 });
CourseSchema.index({ conversationId: 1 });

export const Course = mongoose.model<ICourse>("Course", CourseSchema);
