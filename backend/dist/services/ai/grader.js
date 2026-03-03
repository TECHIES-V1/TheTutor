"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeOpenEndedAnswer = gradeOpenEndedAnswer;
const ai_1 = require("ai");
const zod_1 = require("zod");
const ai_2 = require("../../config/ai");
async function gradeOpenEndedAnswer({ question, expectedAnswer, studentAnswer, lessonContent, }) {
    try {
        const { object } = await (0, ai_1.generateObject)({
            model: (0, ai_2.getModel)(),
            schema: zod_1.z.object({
                isCorrect: zod_1.z
                    .boolean()
                    .describe("Whether the student's answer demonstrates understanding of the core concepts in the rubric."),
                feedback: zod_1.z
                    .string()
                    .describe("Constructive, encouraging feedback. If correct, briefly validate why. If incorrect, explain what was missing from the rubric."),
            }),
            system: `You are an expert AI tutor evaluating a student's answer to an open-ended question.
      
Your job is to read the student's answer and compare it against the grading rubric / expected answers.
If the student captures the main ideas, mark it as correct, even if they use different words.
If the student is completely wrong, misses the core point entirely, or gives a joke answer, mark it as incorrect.

Provide specific, encouraging feedback in the voice of a supportive tutor.`,
            prompt: `
**Question**: ${question}

**Grading Rubric / Expected Concepts**:
${expectedAnswer}

**Student's Answer**:
${studentAnswer}

${lessonContent
                ? `**Context (Lesson Content)**:\n${lessonContent.substring(0, 1500)}...\n`
                : ""}

Evaluate the student's answer.`,
        });
        return object;
    }
    catch (error) {
        console.error("AI Grading Error:", error);
        // Fallback if AI fails: naive check
        const expected = (expectedAnswer || "").toLowerCase().trim();
        const provided = (studentAnswer || "").toLowerCase().trim();
        const isCorrect = expected === provided || provided.includes(expected);
        return {
            isCorrect,
            feedback: "Answer recorded. (AI evaluation temporarily unavailable)",
        };
    }
}
