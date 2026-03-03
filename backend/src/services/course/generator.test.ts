import { describe, it, expect } from "vitest";
import {
  parseCourseContent,
  createStreamMilestoneState,
  consumeCourseStreamChunk,
  flushCourseStreamMilestones,
} from "./generator";

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
    // Content fallback kicks in because "This is basic content." is too short;
    // the parser uses the full lesson text instead
    expect(lesson.content).toContain("This is basic content.");
  });

  it("should parse lesson quiz when there are newlines between **Quiz**: and the code fence", () => {
    const mockContent = `
# Course: Test Course

## Description
A test course.

## Module 1: Basics
Basic module.

### Lesson 1.1: Node Intro
**Estimated Time**: 20 minutes
**Description**: Intro to Node

**Content**:
Node.js is a runtime built on Chrome V8. It allows developers to build scalable backend applications using JavaScript. Its event-driven, non-blocking I/O model makes it efficient for data-intensive real-time applications.

**Key Takeaways**:
- JavaScript runtime
- Non-blocking I/O

**Videos**:
[Search: "Node.js basics tutorial"]

**Citations**:
- [Source: "Node.js Design Patterns"] Casciaro, M. (2020). *Node.js Design Patterns*. Packt.

**Quiz**:

\`\`\`json
[
  {"id":"q1","type":"multiple_choice","question":"What is Node.js?","options":["A runtime","A database","An OS","A browser"],"correctAnswerIndex":0,"explanation":"Node.js is a runtime."}
]
\`\`\`

**Exercises**:
Create a simple HTTP server.
`;

    const parsed = parseCourseContent(mockContent);
    const lesson = parsed.modules[0].lessons[0];
    expect(lesson.quizzes!.length).toBe(1);
    expect(lesson.quizzes![0].questions.length).toBe(1);
    expect(lesson.quizzes![0].questions[0].question).toBe("What is Node.js?");
  });

  it("should parse module quiz when heading is just ### Quiz (no module number)", () => {
    const mockContent = `
# Course: Test Course

## Description
A test course.

## Module 1: Basics
Basic module.

### Lesson 1.1: Intro
**Estimated Time**: 20 minutes
**Description**: Intro lesson

**Content**:
This is a substantial introduction to the basics of programming. We will cover variables, data types, and control flow. Each concept builds on the previous one, allowing you to construct increasingly complex programs.

**Key Takeaways**:
- Variables hold data
- Control flow directs execution

**Videos**:
[Search: "programming basics tutorial"]

**Citations**:
- [Source: "Clean Code"] Martin, R. (2008). *Clean Code*. Prentice Hall.

**Quiz**:
\`\`\`json
[{"id":"q1","type":"multiple_choice","question":"What is a variable?","options":["Storage","Function","Loop","Class"],"correctAnswerIndex":0,"explanation":"A variable stores data."}]
\`\`\`

**Exercises**:
Create a variable and print it.

### Quiz
\`\`\`json
[{"questionId":"mq-1-1","prompt":"What are the basics?","expectedConcepts":[["variables","control flow"]],"remediationTip":"Review the intro lesson."}]
\`\`\`
`;

    const parsed = parseCourseContent(mockContent);
    expect(parsed.modules[0].moduleQuiz).toBeDefined();
    expect(parsed.modules[0].moduleQuiz!.questions.length).toBe(1);
    expect(parsed.modules[0].moduleQuiz!.questions[0].prompt).toBe("What are the basics?");
  });

  it("should use content fallback when **Content**: capture is too short", () => {
    const mockContent = `
# Course: Test Course

## Description
A test course.

## Module 1: Basics
Basic module.

### Lesson 1.1: Intro
**Estimated Time**: 20 minutes
**Description**: Intro lesson

**Content**:
Short intro.

**Key Takeaways**:
- Understanding the basics of programming is essential for building applications
- Programming involves writing instructions that computers can execute
- Learning to code opens up many career opportunities in technology

**Videos**:
[Search: "programming basics tutorial"]

**Quiz**:
\`\`\`json
[{"id":"q1","type":"multiple_choice","question":"What is programming?","options":["Writing instructions","Drawing","Singing","Running"],"correctAnswerIndex":0,"explanation":"Programming is writing instructions."}]
\`\`\`

**Exercises**:
Write a hello world program.
`;

    const parsed = parseCourseContent(mockContent);
    const lesson = parsed.modules[0].lessons[0];
    // Should fallback to full lesson text (minus quiz/exercises), not just the short "Short intro."
    expect(lesson.content.length).toBeGreaterThan(100);
  });
});

describe("stream milestone parser", () => {
  it("detects title and module boundaries in order", () => {
    const state = createStreamMilestoneState();

    const firstEvents = consumeCourseStreamChunk(
      "# Course: Test-Driven Development\n## Module 1: Foundations\n",
      state
    );
    expect(firstEvents).toEqual([
      { type: "course_title", data: { title: "Test-Driven Development" } },
      { type: "module_started", data: { index: 0, title: "Foundations" } },
    ]);

    const secondEvents = consumeCourseStreamChunk(
      "### Lesson 1.1: Intro\n## Module 2: Mocking\n",
      state
    );
    expect(secondEvents).toEqual([
      { type: "module_complete", data: { index: 0, title: "Foundations" } },
      { type: "module_started", data: { index: 1, title: "Mocking" } },
    ]);

    const finalEvents = flushCourseStreamMilestones(state);
    expect(finalEvents).toEqual([
      { type: "module_complete", data: { index: 1, title: "Mocking" } },
    ]);
  });

  it("flushes trailing buffered line before final module completion", () => {
    const state = createStreamMilestoneState();

    const chunkEvents = consumeCourseStreamChunk(
      "# Course: Data Analysis\n## Module 1: Setup\n## Module 2: Statistics",
      state
    );
    expect(chunkEvents).toEqual([
      { type: "course_title", data: { title: "Data Analysis" } },
      { type: "module_started", data: { index: 0, title: "Setup" } },
    ]);

    const flushEvents = flushCourseStreamMilestones(state);
    expect(flushEvents).toEqual([
      { type: "module_complete", data: { index: 0, title: "Setup" } },
      { type: "module_started", data: { index: 1, title: "Statistics" } },
      { type: "module_complete", data: { index: 1, title: "Statistics" } },
    ]);
  });
});
