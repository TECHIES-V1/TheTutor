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
exports.Conversation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MessageSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: {
        phase: {
            type: String,
            enum: ["topic", "level", "time", "goal", "confirmation"],
        },
        extractedData: {
            topic: String,
            level: { type: String, enum: ["beginner", "intermediate", "advanced"] },
            hoursPerWeek: Number,
            goal: String,
            confirmedSubject: String,
            suggestedSubject: String,
        },
    },
}, { _id: false });
const ConversationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
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
    status: {
        type: String,
        enum: ["active", "completed", "abandoned"],
        default: "active",
    },
    courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Course" },
}, { timestamps: true });
// Index for finding active conversations by user
ConversationSchema.index({ userId: 1, status: 1 });
exports.Conversation = mongoose_1.default.model("Conversation", ConversationSchema);
