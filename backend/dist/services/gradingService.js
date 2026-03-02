"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PASS_THRESHOLD = void 0;
exports.gradeQuiz = gradeQuiz;
exports.PASS_THRESHOLD = 0.7;
function normalize(input) {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function formatMissingConcept(group) {
    return group[0] ?? "key concept";
}
function gradeQuiz(quiz, answers) {
    const byQuestionId = new Map();
    for (const answer of answers) {
        byQuestionId.set(answer.questionId, answer.response);
    }
    const feedback = [];
    let totalScore = 0;
    for (const question of quiz) {
        const rawAnswer = byQuestionId.get(question.questionId) ?? "";
        const normalized = normalize(rawAnswer);
        const groups = question.expectedConcepts;
        const missingConcepts = [];
        let matchedGroups = 0;
        for (const group of groups) {
            const found = group.some((concept) => normalized.includes(normalize(concept)));
            if (found) {
                matchedGroups += 1;
            }
            else {
                missingConcepts.push(formatMissingConcept(group));
            }
        }
        const questionScore = groups.length > 0 ? matchedGroups / groups.length : 0;
        totalScore += questionScore;
        const correctiveFeedback = missingConcepts.length === 0
            ? "Great response. You covered the expected concepts."
            : `${question.remediationTip} Missing: ${missingConcepts.join(", ")}.`;
        feedback.push({
            questionId: question.questionId,
            score: Number(questionScore.toFixed(2)),
            missingConcepts,
            correctiveFeedback,
        });
    }
    const score = quiz.length > 0 ? totalScore / quiz.length : 0;
    const rounded = Number(score.toFixed(2));
    return {
        score: rounded,
        passed: rounded >= exports.PASS_THRESHOLD,
        feedback,
    };
}
