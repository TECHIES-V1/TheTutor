import { describe, it, expect } from "vitest";
import { parseCourseContent } from "./generator";

describe("parseCourseContent", () => {
  it("should parse course content including interactive elements", () => {
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

    const parsed = parseCourseContent(mockContent);

    expect(parsed.title).toBe("Introduction to React");
    expect(parsed.description).toBe("A comprehensive course on React basics.");
    expect(parsed.modules.length).toBe(1);
    expect(parsed.modules[0].title).toBe("Getting Started");

    const lesson = parsed.modules[0].lessons[0];
    expect(lesson.title).toBe("What is React?");
    expect(lesson.estimatedMinutes).toBe(20);

    // Check Videos
    expect(lesson.videoSearchQueries).toEqual([
      "React basics tutorial",
      "Virtual DOM explained"
    ]);

    // Check Quiz
    expect(lesson.quizzes).toBeDefined();
    expect(lesson.quizzes!.length).toBe(1);
    const quiz = lesson.quizzes![0];
    expect(quiz.questions.length).toBe(2);
    expect(quiz.questions[0].type).toBe("multiple_choice");
    expect(quiz.questions[0].question).toBe("What is React?");
    expect(quiz.questions[0].options).toEqual(["A UI library", "A database", "An OS", "A browser"]);
    expect(quiz.questions[0].correctAnswerIndex).toBe(0);

    expect(quiz.questions[1].type).toBe("open_ended");
    expect(quiz.questions[1].question).toBe("What does React use to optimize rendering?");
    expect(quiz.questions[1].correctAnswerText).toBe("Virtual DOM");

    // Check Exercises
    expect(lesson.interactiveElements).toBeDefined();
    expect(lesson.interactiveElements!.length).toBe(1);
    expect(lesson.interactiveElements![0].type).toBe("exercise");
    expect(lesson.interactiveElements![0].content).toBe("Create your first React component using create-react-app.");
  });

  it("should handle missing sections gracefully", () => {
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

    const parsed = parseCourseContent(mockContent);
    const lesson = parsed.modules[0].lessons[0];

    expect(lesson.videoSearchQueries).toEqual([]);
    expect(lesson.quizzes).toEqual([]);
    expect(lesson.interactiveElements).toEqual([]);
    expect(lesson.content).toBe("This is basic content.");
  });
});
