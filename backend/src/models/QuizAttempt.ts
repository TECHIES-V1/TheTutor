import mongoose, { Document, Schema, Types } from "mongoose";

export interface IQuizAnswer {
  questionId: string;
  response: string;
}

export interface IQuizFeedback {
  questionId: string;
  score: number;
  missingConcepts: string[];
  correctiveFeedback: string;
}

export interface IQuizAttempt extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: string;
  attemptNumber: number;
  answers: IQuizAnswer[];
  score: number;
  passed: boolean;
  feedback: IQuizFeedback[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizAnswerSchema = new Schema<IQuizAnswer>(
  {
    questionId: { type: String, required: true },
    response: { type: String, required: true },
  },
  { _id: false }
);

const QuizFeedbackSchema = new Schema<IQuizFeedback>(
  {
    questionId: { type: String, required: true },
    score: { type: Number, required: true },
    missingConcepts: { type: [String], default: [] },
    correctiveFeedback: { type: String, required: true },
  },
  { _id: false }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lessonId: { type: String, required: true, index: true },
    attemptNumber: { type: Number, required: true },
    answers: { type: [QuizAnswerSchema], default: [] },
    score: { type: Number, required: true, min: 0, max: 1 },
    passed: { type: Boolean, required: true },
    feedback: { type: [QuizFeedbackSchema], default: [] },
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ userId: 1, courseId: 1, lessonId: 1, attemptNumber: -1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);

