import mongoose, { Document, Schema, Types } from "mongoose";
import type {
  ConversationPhase,
  ExperienceLevel,
  OnboardingData,
} from "../types";

export interface IMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    isConfirmation?: boolean;
    suggestedSubject?: string;
  };
}

export interface IConversation extends Document {
  userId: Types.ObjectId;
  messages: IMessage[];
  phase: ConversationPhase;
  onboardingData: {
    topic?: string;
    level?: ExperienceLevel;
    hoursPerWeek?: number;
    goal?: string;
    confirmedSubject?: string;
  };
  confirmationAttempts: number;
  status: "active" | "completed" | "abandoned";
  courseId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: {
      isConfirmation: { type: Boolean },
      suggestedSubject: { type: String },
    },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messages: { type: [MessageSchema], default: [] },
    phase: {
      type: String,
      enum: ["onboarding", "resource_retrieval", "course_generation", "completed"],
      default: "onboarding",
    },
    onboardingData: {
      topic: String,
      level: { type: String, enum: ["beginner", "intermediate", "advanced"] },
      hoursPerWeek: Number,
      goal: String,
      confirmedSubject: String,
    },
    confirmationAttempts: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
  },
  { timestamps: true }
);

ConversationSchema.index({ userId: 1, status: 1 });

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema
);
