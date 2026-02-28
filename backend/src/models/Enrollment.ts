import mongoose, { Document, Schema, Types } from "mongoose";

export type EnrollmentStatus = "active" | "completed";

export interface IEnrollment extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: EnrollmentStatus;
  progressPercent: number;
  currentLessonId: string;
  completedLessonIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    currentLessonId: { type: String, required: true },
    completedLessonIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ userId: 1, updatedAt: -1 });

export const Enrollment = mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);

