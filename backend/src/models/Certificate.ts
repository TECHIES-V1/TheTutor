import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICertificate extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  certificateNumber: string;
  issuedAt: Date;
  pdfPath: string;
  fileName: string;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    certificateNumber: { type: String, required: true, unique: true },
    issuedAt: { type: Date, required: true },
    pdfPath: { type: String, required: true },
    fileName: { type: String, required: true },
  },
  { timestamps: true }
);

CertificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Certificate = mongoose.model<ICertificate>("Certificate", CertificateSchema);

