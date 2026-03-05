import { IQuizAnswer, IQuizFeedback } from "../models/QuizAttempt";

interface GradingQuestion {
  questionId: string;
  prompt: string;
  expectedConcepts: string[][];
  remediationTip: string;
}

export const PASS_THRESHOLD = 0.7;

interface GradeResult {
  score: number;
  passed: boolean;
  feedback: IQuizFeedback[];
}

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMissingConcept(group: string[]): string {
  return group[0] ?? "key concept";
}

export function gradeQuiz(quiz: GradingQuestion[], answers: IQuizAnswer[]): GradeResult {
  const byQuestionId = new Map<string, string>();
  for (const answer of answers) {
    byQuestionId.set(answer.questionId, answer.response);
  }

  const feedback: IQuizFeedback[] = [];
  let totalScore = 0;

  for (const question of quiz) {
    const rawAnswer = byQuestionId.get(question.questionId) ?? "";
    const normalized = normalize(rawAnswer);
    const groups = question.expectedConcepts;
    const missingConcepts: string[] = [];
    let matchedGroups = 0;

    for (const group of groups) {
      const found = group.some((concept) => normalized.includes(normalize(concept)));
      if (found) {
        matchedGroups += 1;
      } else {
        missingConcepts.push(formatMissingConcept(group));
      }
    }

    const questionScore = groups.length > 0 ? matchedGroups / groups.length : 0;
    totalScore += questionScore;

    const correctiveFeedback =
      missingConcepts.length === 0
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
    passed: rounded >= PASS_THRESHOLD,
    feedback,
  };
}
