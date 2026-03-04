import mongoose, { Document, Schema, Types } from "mongoose";

export type JobStatus = "pending" | "running" | "completed" | "failed";
export type JobPhase = "outline" | "lessons" | "enrichment" | "done";

export interface ILessonSlot {
  moduleIndex: number;
  lessonIndex: number;
  lessonId: string;
  title: string;
  bloomsLevel: 1 | 2 | 3 | 4 | 5 | 6;
  status: "pending" | "generating" | "done" | "failed";
  attempts: number;
  error?: string;
}

export interface IGenerationJob extends Document {
  courseId: Types.ObjectId;
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  status: JobStatus;
  currentPhase: JobPhase;
  lessonSlots: ILessonSlot[];
  completedLessonCount: number;
  totalLessonCount: number;
  sourceReferences: Array<{
    title: string;
    authors: string[];
    source: string;
  }>;
  lastEventId: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSlotSchema = new Schema<ILessonSlot>(
  {
    moduleIndex: { type: Number, required: true },
    lessonIndex: { type: Number, required: true },
    lessonId: { type: String, required: true },
    title: { type: String, required: true },
    bloomsLevel: { type: Number, min: 1, max: 6, default: 1 },
    status: {
      type: String,
      enum: ["pending", "generating", "done", "failed"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    error: { type: String },
  },
  { _id: false }
);

const GenerationJobSchema = new Schema<IGenerationJob>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    currentPhase: {
      type: String,
      enum: ["outline", "lessons", "enrichment", "done"],
      default: "outline",
    },
    lessonSlots: { type: [LessonSlotSchema], default: [] },
    completedLessonCount: { type: Number, default: 0 },
    totalLessonCount: { type: Number, default: 0 },
    sourceReferences: {
      type: [
        {
          title: { type: String, required: true },
          authors: { type: [String], default: [] },
          source: { type: String, default: "" },
        },
      ],
      default: [],
      _id: false,
    },
    lastEventId: { type: Number, default: 0 },
    errorMessage: { type: String },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

GenerationJobSchema.index({ status: 1, updatedAt: 1 });
GenerationJobSchema.index({ courseId: 1 });
GenerationJobSchema.index({ conversationId: 1 });
GenerationJobSchema.index({ userId: 1 });

export const GenerationJob = mongoose.model<IGenerationJob>(
  "GenerationJob",
  GenerationJobSchema
);
