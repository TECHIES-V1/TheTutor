"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const course_1 = __importDefault(require("./course"));
const Course_1 = require("../models/Course");
const crypto_1 = require("crypto");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Mock requireAuth middleware
const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
app.use((req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.jwtUser = decoded;
            next();
        }
        catch (err) {
            res.status(401).json({ error: "Invalid token" });
        }
    }
    else {
        // For tests, default to a test user if no token
        req.jwtUser = { userId: "507f1f77bcf86cd799439011" };
        next();
    }
});
app.use("/course", course_1.default);
let mongoServer;
(0, vitest_1.beforeAll)(async () => {
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose_1.default.connect(uri);
});
(0, vitest_1.afterAll)(async () => {
    await mongoose_1.default.disconnect();
    await mongoServer.stop();
});
(0, vitest_1.afterEach)(async () => {
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});
(0, vitest_1.describe)("Course Quiz and Completion API", () => {
    const userId = new mongoose_1.default.Types.ObjectId("507f1f77bcf86cd799439011");
    (0, vitest_1.it)("should mark a multiple_choice question correctly and update quiz completion", async () => {
        // Setup initial course
        const moduleId = (0, crypto_1.randomUUID)();
        const lessonId = (0, crypto_1.randomUUID)();
        const quizId = (0, crypto_1.randomUUID)();
        const questionId1 = (0, crypto_1.randomUUID)();
        const questionId2 = (0, crypto_1.randomUUID)();
        const course = new Course_1.Course({
            userId,
            conversationId: new mongoose_1.default.Types.ObjectId(),
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
        let res = await (0, supertest_1.default)(app)
            .post("/course/" + course._id + "/modules/" + moduleId + "/lessons/" + lessonId + "/quizzes/" + quizId + "/questions/" + questionId1 + "/answer")
            .send({ answer: 1 });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.isCorrect).toBe(true);
        (0, vitest_1.expect)(res.body.quizCompleted).toBe(false); // Q2 not answered
        // Answer Q2 correctly
        res = await (0, supertest_1.default)(app)
            .post("/course/" + course._id + "/modules/" + moduleId + "/lessons/" + lessonId + "/quizzes/" + quizId + "/questions/" + questionId2 + "/answer")
            .send({ answer: "React" });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.isCorrect).toBe(true);
        (0, vitest_1.expect)(res.body.quizCompleted).toBe(true); // Both answered
    });
    (0, vitest_1.it)("should not allow marking lesson complete if quizzes are not completed", async () => {
        const moduleId = (0, crypto_1.randomUUID)();
        const lessonId = (0, crypto_1.randomUUID)();
        const quizId = (0, crypto_1.randomUUID)();
        const questionId = (0, crypto_1.randomUUID)();
        const course = new Course_1.Course({
            userId,
            conversationId: new mongoose_1.default.Types.ObjectId(),
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
        let res = await (0, supertest_1.default)(app)
            .put("/course/" + course._id + "/progress")
            .send({ lessonId, completed: true });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.error).toBe("All quizzes and interactive elements must be completed first.");
        // Answer quiz correctly
        await (0, supertest_1.default)(app)
            .post("/course/" + course._id + "/modules/" + moduleId + "/lessons/" + lessonId + "/quizzes/" + quizId + "/questions/" + questionId + "/answer")
            .send({ answer: 0 });
        // Now try to mark lesson complete
        res = await (0, supertest_1.default)(app)
            .put("/course/" + course._id + "/progress")
            .send({ lessonId, completed: true });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.success).toBe(true);
        (0, vitest_1.expect)(res.body.moduleCompleted).toBe(true);
        (0, vitest_1.expect)(res.body.courseCompleted).toBe(true);
    });
});
