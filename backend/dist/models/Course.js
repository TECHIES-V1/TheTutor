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
exports.Course = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LessonResourceSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: {
        type: String,
        enum: ["article", "video", "book", "exercise"],
        required: true,
    },
}, { _id: false });
const QuizQuestionSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ["multiple_choice", "open_ended"], required: true },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswerIndex: { type: Number },
    correctAnswerText: { type: String },
    explanation: { type: String, required: true },
    isAnsweredCorrectly: { type: Boolean, default: false },
}, { _id: false });
const QuizSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    questions: { type: [QuizQuestionSchema], default: [] },
    isCompleted: { type: Boolean, default: false },
}, { _id: false });
const InteractiveElementSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    metadata: { type: Map, of: mongoose_1.Schema.Types.Mixed },
    isCompleted: { type: Boolean, default: false },
}, { _id: false });
const LessonSchema = new mongoose_1.Schema({
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
}, { _id: false });
const ModuleSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    lessons: { type: [LessonSchema], default: [] },
}, { _id: false });
const CourseSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    resources: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Resource" }],
    progress: {
        completedLessons: { type: Number, default: 0 },
        totalLessons: { type: Number, default: 0 },
        percentComplete: { type: Number, default: 0 },
        lastAccessedAt: Date,
    },
    generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });
// Index for finding courses by user
CourseSchema.index({ userId: 1, status: 1 });
CourseSchema.index({ conversationId: 1 });
exports.Course = mongoose_1.default.model("Course", CourseSchema);
