import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import express from "express";
import jwt from "jsonwebtoken";
import courseRouter from "./course";
import { Course } from "../models/Course";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Mock requireAuth middleware
const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

app.use((req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      (req as any).jwtUser = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  } else {
    // For tests, default to a test user if no token
    (req as any).jwtUser = { userId: "507f1f77bcf86cd799439011" };
    next();
  }
});

app.use("/course", courseRouter);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe("Course Quiz and Completion API", () => {
  const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");

  it("should mark a multiple_choice question correctly and update quiz completion", async () => {
    // Setup initial course
    const moduleId = randomUUID();
    const lessonId = randomUUID();
    const quizId = randomUUID();
    const questionId1 = randomUUID();
    const questionId2 = randomUUID();

    const course = new Course({
      userId,
      conversationId: new mongoose.Types.ObjectId(),
      title: "Test Course",
      subject: "Test",
      level: "beginner",
      status: "active",
      modules: [
        {
          id: moduleId,
          title: "Module 1",
          order: 0,
          completed: false,
          lessons: [
            {
              id: lessonId,
              title: "Lesson 1",
              content: "Content",
              order: 0,
              completed: false,
              quizzes: [
                {
                  id: quizId,
                  title: "Quiz 1",
                  isCompleted: false,
                  questions: [
                    {
                      id: questionId1,
                      type: "multiple_choice",
                      question: "Q1",
                      options: ["A", "B", "C"],
                      correctAnswerIndex: 1,
                      explanation: "B is correct",
                      isAnsweredCorrectly: false,
                    },
                    {
                      id: questionId2,
                      type: "open_ended",
                      question: "Q2",
                      correctAnswerText: "React",
                      explanation: "React is correct",
                      isAnsweredCorrectly: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      progress: {
        completedLessons: 0,
        totalLessons: 1,
        percentComplete: 0,
      },
    });

    await course.save();

    // Answer Q1 correctly
    let res = await request(app)
      .post("/course/" + course._id + "/modules/" + moduleId + "/lessons/" + lessonId + "/quizzes/" + quizId + "/questions/" + questionId1 + "/answer")
      .send({ answer: 1 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isCorrect).toBe(true);
    expect(res.body.quizCompleted).toBe(false); // Q2 not answered

    // Answer Q2 correctly
    res = await request(app)
      .post("/course/" + course._id + "/modules/" + moduleId + "/lessons/" + lessonId + "/quizzes/" + quizId + "/questions/" + questionId2 + "/answer")
      .send({ answer: "React" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isCorrect).toBe(true);
    expect(res.body.quizCompleted).toBe(true); // Both answered
  });

  it("should not allow marking lesson complete if quizzes are not completed", async () => {
    const moduleId = randomUUID();
    const lessonId = randomUUID();
    const quizId = randomUUID();
    const questionId = randomUUID();

    const course = new Course({
      userId,
      conversationId: new mongoose.Types.ObjectId(),
      title: "Test Course",
      subject: "Test",
      level: "beginner",
      status: "active",
      modules: [
        {
          id: moduleId,
          title: "Module 1",
          order: 0,
          completed: false,
          lessons: [
            {
              id: lessonId,
              title: "Lesson 1",
              content: "Content",
              order: 0,
              completed: false,
              quizzes: [
                {
                  id: quizId,
                  title: "Quiz 1",
                  isCompleted: false,
                  questions: [
                    {
                      id: questionId,
                      type: "multiple_choice",
                      question: "Q1",
                      options: ["A", "B", "C"],
                      correctAnswerIndex: 0,
                      explanation: "A is correct",
                      isAnsweredCorrectly: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      progress: { completedLessons: 0, totalLessons: 1, percentComplete: 0 },
    });

    await course.save();

    // Try to mark lesson complete before quiz
    let res = await request(app)
      .put("/course/" + course._id + "/progress")
      .send({ lessonId, completed: true });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("All quizzes and interactive elements must be completed first.");

    // Answer quiz correctly
    await request(app)
      .post("/course/" + course._id + "/modules/" + moduleId + "/lessons/" + lessonId + "/quizzes/" + quizId + "/questions/" + questionId + "/answer")
      .send({ answer: 0 });

    // Now try to mark lesson complete
    res = await request(app)
      .put("/course/" + course._id + "/progress")
      .send({ lessonId, completed: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.moduleCompleted).toBe(true);
    expect(res.body.courseCompleted).toBe(true);
  });
});
