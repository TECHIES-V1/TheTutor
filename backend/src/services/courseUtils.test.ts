import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { Course } from "../models/Course";
import { findLessonById, flattenLessons, getTotalLessonCount } from "./courseUtils";

function buildLegacyBase() {
  return {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    conversationId: new Types.ObjectId(),
    title: "Sample Course",
    description: "Test",
    subject: "Subject",
    level: "beginner" as const,
    status: "active" as const,
    modules: [],
    progress: {
      completedLessons: 0,
      totalLessons: 0,
      percentComplete: 0,
    },
  };
}

describe("courseUtils compatibility", () => {
  it("reads curriculum lessons from hydrated docs even when curriculum is not a schema path", () => {
    const hydrated = Course.hydrate({
      ...buildLegacyBase(),
      curriculum: [
        {
          moduleId: "mod-1",
          title: "Module One",
          order: 1,
          lessons: [
            {
              lessonId: "lesson-1",
              order: 1,
              title: "Intro",
              summary: "Overview",
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              contentMarkdown: "# Intro",
              quiz: [
                {
                  questionId: "q1",
                  prompt: "What is this lesson about?",
                  expectedConcepts: [["intro"], ["overview"]],
                  remediationTip: "Mention the topic and objective.",
                },
              ],
            },
          ],
        },
      ],
    });

    const lessons = flattenLessons(hydrated as any);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].moduleId).toBe("mod-1");
    expect(lessons[0].lesson.lessonId).toBe("lesson-1");
    expect(lessons[0].lesson.quiz).toHaveLength(1);
    expect(getTotalLessonCount(hydrated as any)).toBe(1);
  });

  it("keeps legacy modules behavior unchanged", () => {
    const hydrated = Course.hydrate({
      ...buildLegacyBase(),
      modules: [
        {
          id: "legacy-mod",
          title: "Legacy Module",
          order: 1,
          lessons: [
            {
              id: "legacy-lesson",
              title: "Legacy Lesson",
              description: "Legacy summary",
              content: "Legacy content",
              estimatedMinutes: 15,
              order: 1,
              completed: false,
              quizzes: [
                {
                  id: "legacy-quiz",
                  title: "Quiz",
                  isCompleted: false,
                  questions: [
                    {
                      id: "legacy-q1",
                      type: "open_ended",
                      question: "Legacy question?",
                      correctAnswerText: "legacy",
                      explanation: "legacy explanation",
                      isAnsweredCorrectly: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const found = findLessonById(hydrated as any, "legacy-lesson");
    expect(found).not.toBeNull();
    expect(found?.lesson.summary).toBe("Legacy summary");
    expect(found?.lesson.quiz[0]?.questionId).toBe("legacy-q1");
  });
});

