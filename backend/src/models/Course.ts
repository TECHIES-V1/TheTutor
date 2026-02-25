import mongoose, { Document, Schema, Types } from "mongoose";
import { CourseLevel } from "../types/courseContract";

export type CourseVisibility = "draft" | "published";
export type CourseAccessModel = "free_hackathon";
export type CourseGenerationStatus = "pending" | "ready" | "failed";
export type CourseCreatedBy = "generator" | "stub";

export interface IQuizQuestion {
  questionId: string;
  prompt: string;
  expectedConcepts: string[][];
  remediationTip: string;
}

export interface ILesson {
  lessonId: string;
  order: number;
  title: string;
  summary: string;
  videoUrl: string;
  contentMarkdown: string;
  quiz: IQuizQuestion[];
}

export interface IModule {
  moduleId: string;
  order: number;
  title: string;
  lessons: ILesson[];
}

export interface ICourse extends Document {
  ownerId: Types.ObjectId;
  ownerName: string;
  title: string;
  description: string;
  topic: string;
  level: CourseLevel;
  goal: string;
  visibility: CourseVisibility;
  accessModel: CourseAccessModel;
  generationStatus: CourseGenerationStatus;
  createdBy: CourseCreatedBy;
  curriculum: IModule[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionId: { type: String, required: true },
    prompt: { type: String, required: true },
    expectedConcepts: {
      type: [[String]],
      required: true,
    },
    remediationTip: { type: String, required: true },
  },
  { _id: false }
);

const LessonSchema = new Schema<ILesson>(
  {
    lessonId: { type: String, required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    videoUrl: { type: String, required: true },
    contentMarkdown: { type: String, required: true },
    quiz: { type: [QuizQuestionSchema], default: [] },
  },
  { _id: false }
);

const ModuleSchema = new Schema<IModule>(
  {
    moduleId: { type: String, required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    lessons: { type: [LessonSchema], default: [] },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    topic: { type: String, required: true },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    goal: { type: String, required: true },
    visibility: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    accessModel: {
      type: String,
      enum: ["free_hackathon"],
      default: "free_hackathon",
    },
    generationStatus: {
      type: String,
      enum: ["pending", "ready", "failed"],
      default: "ready",
    },
    createdBy: {
      type: String,
      enum: ["generator", "stub"],
      default: "stub",
    },
    curriculum: { type: [ModuleSchema], default: [] },
  },
  { timestamps: true }
);

CourseSchema.index({ ownerId: 1, createdAt: -1 });

export const Course = mongoose.model<ICourse>("Course", CourseSchema);

