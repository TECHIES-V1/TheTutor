import { ILesson } from "../models/Course";

interface AssistantResult {
  answer: string;
  contextTag: string;
}

function normalize(input: string): string {
  return input.toLowerCase().trim();
}

export function generateLessonAssistantReply(lesson: ILesson, question: string): AssistantResult {
  const q = normalize(question);
  const title = lesson.title;
  const summaryText =
    lesson.description?.trim() ||
    String(lesson.content ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");

  if (!q) {
    return {
      answer: `Ask me anything about "${title}" and I will help you focus on the key concepts and quiz expectations.`,
      contextTag: "empty_question",
    };
  }

  if (q.includes("summary") || q.includes("what is this about")) {
    return {
      answer: summaryText || `This lesson focuses on ${title}.`,
      contextTag: "lesson_summary",
    };
  }

  if (q.includes("quiz") || q.includes("pass") || q.includes("score")) {
    return {
      answer:
        "To pass this lesson, explain concepts clearly, use concrete examples, and address each quiz prompt directly. The pass threshold is 70%.",
      contextTag: "quiz_guidance",
    };
  }

  if (q.includes("next") || q.includes("plan") || q.includes("practice")) {
    return {
      answer:
        "Use this sequence: review the lesson summary, draft short answers for each quiz question, then refine your wording to include concrete concepts.",
      contextTag: "practice_plan",
    };
  }

  return {
    answer: `For "${title}", focus on the core ideas from the lesson text, then connect them to your own words with one practical example per answer.`,
    contextTag: "default_contextual_help",
  };
}
