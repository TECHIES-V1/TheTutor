import mongoose, { Document, Schema } from "mongoose";
import type { BookSource, ParsedChapter } from "../types";

export interface IResource extends Document {
  source: BookSource;
  externalId: string; // ID from the source (Gutenberg ID, OpenLibrary ID, etc.)
  title: string;
  authors: string[];
  downloadUrl?: string;
  format?: string;
  description?: string;
  subjects?: string[];
  publishYear?: number;
  parsedContent?: {
    summary: string;
    chapters: ParsedChapter[];
    totalPages?: number;
    wordCount?: number;
  };
  parseStatus: "pending" | "parsing" | "complete" | "failed";
  parseError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParsedChapterSchema = new Schema<ParsedChapter>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const ResourceSchema = new Schema<IResource>(
  {
    source: {
      type: String,
      enum: ["gutendex", "openlibrary", "standard-ebooks"],
      required: true,
    },
    externalId: { type: String, required: true },
    title: { type: String, required: true },
    authors: { type: [String], default: [] },
    downloadUrl: String,
    format: String,
    description: String,
    subjects: { type: [String], default: [] },
    publishYear: Number,
    parsedContent: {
      summary: String,
      chapters: { type: [ParsedChapterSchema], default: [] },
      totalPages: Number,
      wordCount: Number,
    },
    parseStatus: {
      type: String,
      enum: ["pending", "parsing", "complete", "failed"],
      default: "pending",
    },
    parseError: String,
  },
  { timestamps: true }
);

// Compound index for finding resources by source and external ID
ResourceSchema.index({ source: 1, externalId: 1 }, { unique: true });
ResourceSchema.index({ parseStatus: 1 });

export const Resource = mongoose.model<IResource>("Resource", ResourceSchema);
