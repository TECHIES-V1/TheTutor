"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resource = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ParsedChapterSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    order: { type: Number, required: true },
}, { _id: false });
const ResourceSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
// Compound index for finding resources by source and external ID
ResourceSchema.index({ source: 1, externalId: 1 }, { unique: true });
ResourceSchema.index({ parseStatus: 1 });
exports.Resource = mongoose_1.default.model("Resource", ResourceSchema);
