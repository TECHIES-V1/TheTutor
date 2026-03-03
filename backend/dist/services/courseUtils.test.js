"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mongoose_1 = require("mongoose");
const Course_1 = require("../models/Course");
const courseUtils_1 = require("./courseUtils");
function buildLegacyBase() {
    return {
        _id: new mongoose_1.Types.ObjectId(),
        userId: new mongoose_1.Types.ObjectId(),
        conversationId: new mongoose_1.Types.ObjectId(),
        title: "Sample Course",
        description: "Test",
        subject: "Subject",
        level: "beginner",
        status: "active",
        modules: [],
        progress: {
            completedLessons: 0,
            totalLessons: 0,
            percentComplete: 0,
        },
    };
}
(0, vitest_1.describe)("courseUtils compatibility", () => {
    (0, vitest_1.it)("reads curriculum lessons from hydrated docs even when curriculum is not a schema path", () => {
        const hydrated = Course_1.Course.hydrate({
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
        const lessons = (0, courseUtils_1.flattenLessons)(hydrated);
        (0, vitest_1.expect)(lessons).toHaveLength(1);
        (0, vitest_1.expect)(lessons[0].moduleId).toBe("mod-1");
        (0, vitest_1.expect)(lessons[0].lesson.lessonId).toBe("lesson-1");
        (0, vitest_1.expect)(lessons[0].lesson.quiz).toHaveLength(1);
        (0, vitest_1.expect)((0, courseUtils_1.getTotalLessonCount)(hydrated)).toBe(1);
    });
    (0, vitest_1.it)("keeps legacy modules behavior unchanged", () => {
        const hydrated = Course_1.Course.hydrate({
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
        const found = (0, courseUtils_1.findLessonById)(hydrated, "legacy-lesson");
        (0, vitest_1.expect)(found).not.toBeNull();
        (0, vitest_1.expect)(found?.lesson.summary).toBe("Legacy summary");
        (0, vitest_1.expect)(found?.lesson.quiz[0]?.questionId).toBe("legacy-q1");
    });
});
