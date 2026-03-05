import { generateObject } from "ai";
import { z } from "zod";
import { getModel } from "../../config/ai";

export async function gradeOpenEndedAnswer({
    question,
    expectedAnswer,
    studentAnswer,
    lessonContent,
}: {
    question: string;
    expectedAnswer: string;
    studentAnswer: string;
    lessonContent?: string;
}): Promise<{ isCorrect: boolean; feedback: string }> {
    try {
        const { object } = await generateObject({
            model: getModel(),
            schema: z.object({
                isCorrect: z
                    .boolean()
                    .describe(
                        "Whether the student's answer demonstrates understanding of the core concepts in the rubric."
                    ),
                feedback: z
                    .string()
                    .describe(
                        "Constructive, encouraging feedback. If correct, briefly validate why. If incorrect, explain what was missing from the rubric."
                    ),
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
                    : ""
                }

Evaluate the student's answer.`,
        });

        return object;
    } catch (error) {
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
