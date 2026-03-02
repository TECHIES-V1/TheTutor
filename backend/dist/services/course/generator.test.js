"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const generator_1 = require("./generator");
(0, vitest_1.describe)("parseCourseContent", () => {
    (0, vitest_1.it)("should parse course content including interactive elements", () => {
        const mockContent = `
# Course: Introduction to React

## Description
A comprehensive course on React basics.

## Module 1: Getting Started
Welcome to React.

### Lesson 1.1: What is React?
**Estimated Time**: 20 minutes
**Description**: Learn the basics of React.

**Content**:
React is a UI library.
It uses a virtual DOM.

**Key Takeaways**:
- UI library
- Virtual DOM

**Videos**:
[Search: "React basics tutorial"]
[Search: "Virtual DOM explained"]

**Quiz**:
\`\`\`json
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "What is React?",
    "options": ["A UI library", "A database", "An OS", "A browser"],
    "correctAnswerIndex": 0,
    "explanation": "React is a UI library."
  },
  {
    "id": "q2",
    "type": "open_ended",
    "question": "What does React use to optimize rendering?",
    "correctAnswerText": "Virtual DOM",
    "explanation": "React uses the Virtual DOM."
  }
]
\`\`\`

**Exercises**:
Create your first React component using create-react-app.
`;
        const parsed = (0, generator_1.parseCourseContent)(mockContent);
        (0, vitest_1.expect)(parsed.title).toBe("Introduction to React");
        (0, vitest_1.expect)(parsed.description).toBe("A comprehensive course on React basics.");
        (0, vitest_1.expect)(parsed.modules.length).toBe(1);
        (0, vitest_1.expect)(parsed.modules[0].title).toBe("Getting Started");
        const lesson = parsed.modules[0].lessons[0];
        (0, vitest_1.expect)(lesson.title).toBe("What is React?");
        (0, vitest_1.expect)(lesson.estimatedMinutes).toBe(20);
        // Check Videos
        (0, vitest_1.expect)(lesson.videoSearchQueries).toEqual([
            "React basics tutorial",
            "Virtual DOM explained"
        ]);
        // Check Quiz
        (0, vitest_1.expect)(lesson.quizzes).toBeDefined();
        (0, vitest_1.expect)(lesson.quizzes.length).toBe(1);
        const quiz = lesson.quizzes[0];
        (0, vitest_1.expect)(quiz.questions.length).toBe(2);
        (0, vitest_1.expect)(quiz.questions[0].type).toBe("multiple_choice");
        (0, vitest_1.expect)(quiz.questions[0].question).toBe("What is React?");
        (0, vitest_1.expect)(quiz.questions[0].options).toEqual(["A UI library", "A database", "An OS", "A browser"]);
        (0, vitest_1.expect)(quiz.questions[0].correctAnswerIndex).toBe(0);
        (0, vitest_1.expect)(quiz.questions[1].type).toBe("open_ended");
        (0, vitest_1.expect)(quiz.questions[1].question).toBe("What does React use to optimize rendering?");
        (0, vitest_1.expect)(quiz.questions[1].correctAnswerText).toBe("Virtual DOM");
        // Check Exercises
        (0, vitest_1.expect)(lesson.interactiveElements).toBeDefined();
        (0, vitest_1.expect)(lesson.interactiveElements.length).toBe(1);
        (0, vitest_1.expect)(lesson.interactiveElements[0].type).toBe("exercise");
        (0, vitest_1.expect)(lesson.interactiveElements[0].content).toBe("Create your first React component using create-react-app.");
    });
    (0, vitest_1.it)("should handle missing sections gracefully", () => {
        const mockContent = `
# Course: Basic Course

## Description
A basic course.

## Module 1: Basics
Basic module.

### Lesson 1.1: Basic Lesson
**Estimated Time**: 15 minutes
**Description**: Just a basic lesson.

**Content**:
This is basic content.

**Key Takeaways**:
- Basic
`;
        const parsed = (0, generator_1.parseCourseContent)(mockContent);
        const lesson = parsed.modules[0].lessons[0];
        (0, vitest_1.expect)(lesson.videoSearchQueries).toEqual([]);
        (0, vitest_1.expect)(lesson.quizzes).toEqual([]);
        (0, vitest_1.expect)(lesson.interactiveElements).toEqual([]);
        (0, vitest_1.expect)(lesson.content).toBe("This is basic content.");
    });
});
