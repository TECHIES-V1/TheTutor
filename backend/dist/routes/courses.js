"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = require("mongoose");
const auth_1 = require("../middleware/auth");
const Course_1 = require("../models/Course");
const Enrollment_1 = require("../models/Enrollment");
const QuizAttempt_1 = require("../models/QuizAttempt");
const Certificate_1 = require("../models/Certificate");
const User_1 = require("../models/User");
const generationAdapter_1 = require("../services/generationAdapter");
const assistantService_1 = require("../services/assistantService");
const gradingService_1 = require("../services/gradingService");
const certificateService_1 = require("../services/certificateService");
const courseUtils_1 = require("../services/courseUtils");
const auth_2 = require("../utils/auth");
const router = (0, express_1.Router)();
function toCourseId(param) {
    if (!mongoose_1.Types.ObjectId.isValid(param))
        return null;
    return new mongoose_1.Types.ObjectId(param);
}
function normalizeLevel(input) {
    const raw = String(input ?? "").trim().toLowerCase();
    if (raw === "beginner" || raw === "intermediate" || raw === "advanced") {
        return raw;
    }
    return "beginner";
}
function parseOnboarding(payload) {
    const data = (payload ?? {});
    const topic = String(data.topic ?? "").trim() || "General Learning";
    const goal = String(data.goal ?? "").trim() || "Build practical skills";
    const hoursRaw = Number(data.hoursPerWeek ?? 4);
    const hoursPerWeek = Number.isFinite(hoursRaw) ? Math.max(1, Math.min(40, Math.round(hoursRaw))) : 4;
    const level = normalizeLevel(data.level);
    return {
        topic,
        level,
        hoursPerWeek,
        goal,
    };
}
async function ensureEnrollment(userId, course) {
    const firstLesson = (0, courseUtils_1.flattenLessons)(course)[0]?.lesson.lessonId ?? "";
    const existing = await Enrollment_1.Enrollment.findOne({
        userId: userId,
        courseId: course._id,
    });
    if (existing) {
        if (!existing.currentLessonId && firstLesson) {
            existing.currentLessonId = firstLesson;
            await existing.save();
        }
        return existing;
    }
    return Enrollment_1.Enrollment.create({
        userId,
        courseId: course._id,
        status: "active",
        progressPercent: 0,
        currentLessonId: firstLesson,
        completedLessonIds: [],
    });
}
async function getAccessState(userId, course) {
    const isOwner = String(course.ownerId) === userId;
    const enrollment = await Enrollment_1.Enrollment.findOne({ userId, courseId: course._id });
    return { isOwner, enrollment };
}
function buildCourseSummary(course, enrollment) {
    const totalLessons = (0, courseUtils_1.getTotalLessonCount)(course);
    const completedCount = enrollment?.completedLessonIds.length ?? 0;
    return {
        id: String(course._id),
        title: course.title,
        description: course.description,
        topic: course.topic,
        level: course.level,
        goal: course.goal,
        ownerName: course.ownerName,
        visibility: course.visibility,
        accessModel: course.accessModel,
        moduleCount: course.curriculum.length,
        lessonCount: totalLessons,
        enrollment: enrollment
            ? {
                status: enrollment.status,
                progressPercent: enrollment.progressPercent,
                currentLessonId: enrollment.currentLessonId,
                completedLessonCount: completedCount,
            }
            : null,
    };
}
router.post("/bootstrap", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const existingCourse = await Course_1.Course.findOne({ ownerId: userId }).sort({ createdAt: -1 });
        if (existingCourse) {
            const enrollment = await ensureEnrollment(userId, existingCourse);
            if (!user.onboardingCompleted) {
                user.onboardingCompleted = true;
                await user.save();
                res.cookie("token", (0, auth_2.signTokenForUser)(user), auth_2.COOKIE_OPTIONS);
            }
            res.json({
                created: false,
                course: buildCourseSummary(existingCourse, enrollment),
            });
            return;
        }
        const onboarding = parseOnboarding(req.body?.onboarding);
        const generated = await (0, generationAdapter_1.generateCourse)({
            onboarding,
            userName: user.name,
        });
        const course = await Course_1.Course.create({
            ownerId: user._id,
            ownerName: user.name,
            title: generated.course.title,
            description: generated.course.description,
            topic: generated.course.topic,
            level: generated.course.level,
            goal: generated.course.goal,
            visibility: "draft",
            accessModel: "free_hackathon",
            generationStatus: "ready",
            createdBy: generated.source,
            curriculum: generated.course.curriculum,
        });
        const enrollment = await ensureEnrollment(userId, course);
        if (!user.onboardingCompleted) {
            user.onboardingCompleted = true;
            await user.save();
            res.cookie("token", (0, auth_2.signTokenForUser)(user), auth_2.COOKIE_OPTIONS);
        }
        res.status(201).json({
            created: true,
            course: buildCourseSummary(course, enrollment),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/explore", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const courses = await Course_1.Course.find({
            ownerId: { $ne: userId },
            visibility: "published",
            generationStatus: "ready",
        }).sort({ createdAt: -1 });
        const courseIds = courses.map((course) => course._id);
        const enrollments = await Enrollment_1.Enrollment.find({
            userId,
            courseId: { $in: courseIds },
        });
        const enrollmentByCourseId = new Map();
        for (const enrollment of enrollments) {
            enrollmentByCourseId.set(String(enrollment.courseId), enrollment);
        }
        const payload = courses.map((course) => {
            const enrollment = enrollmentByCourseId.get(String(course._id)) ?? null;
            return buildCourseSummary(course, enrollment);
        });
        res.json({ courses: payload });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/:courseId/preview", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const courseId = toCourseId(req.params.courseId);
        if (!courseId) {
            res.status(400).json({ error: "Invalid course ID" });
            return;
        }
        const course = await Course_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const { isOwner, enrollment } = await getAccessState(userId, course);
        const canView = isOwner || course.visibility === "published";
        if (!canView) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        const outline = [...course.curriculum]
            .sort((a, b) => a.order - b.order)
            .map((module) => ({
            moduleId: module.moduleId,
            title: module.title,
            order: module.order,
            lessons: [...module.lessons]
                .sort((a, b) => a.order - b.order)
                .map((lesson) => ({
                lessonId: lesson.lessonId,
                title: lesson.title,
                order: lesson.order,
                summary: lesson.summary,
            })),
        }));
        res.json({
            course: buildCourseSummary(course, enrollment),
            curriculumOutline: outline,
            access: {
                isOwner,
                isEnrolled: !!enrollment,
                canEnroll: !isOwner && !enrollment && course.visibility === "published",
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/:courseId/enroll", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const courseId = toCourseId(req.params.courseId);
        if (!courseId) {
            res.status(400).json({ error: "Invalid course ID" });
            return;
        }
        const course = await Course_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const isOwner = String(course.ownerId) === userId;
        if (!isOwner && course.visibility !== "published") {
            res.status(403).json({ error: "Course is not published" });
            return;
        }
        if (course.generationStatus !== "ready") {
            res.status(409).json({ error: "Course is still generating" });
            return;
        }
        const enrollment = await ensureEnrollment(userId, course);
        res.json({
            enrollment: {
                courseId: String(course._id),
                status: enrollment.status,
                progressPercent: enrollment.progressPercent,
                currentLessonId: enrollment.currentLessonId,
                completedLessonIds: enrollment.completedLessonIds,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/:courseId/lessons/:lessonId", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const courseId = toCourseId(req.params.courseId);
        if (!courseId) {
            res.status(400).json({ error: "Invalid course ID" });
            return;
        }
        const course = await Course_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const { isOwner, enrollment } = await getAccessState(userId, course);
        if (!isOwner && !enrollment) {
            res.status(403).json({ error: "Enrollment required" });
            return;
        }
        const lessonRecord = (0, courseUtils_1.findLessonById)(course, req.params.lessonId);
        if (!lessonRecord) {
            res.status(404).json({ error: "Lesson not found" });
            return;
        }
        const flattened = (0, courseUtils_1.flattenLessons)(course);
        const lessonIndex = flattened.findIndex((item) => item.lesson.lessonId === req.params.lessonId);
        const previousLessonId = lessonIndex > 0 ? flattened[lessonIndex - 1].lesson.lessonId : null;
        const nextLessonId = lessonIndex >= 0 && lessonIndex + 1 < flattened.length ? flattened[lessonIndex + 1].lesson.lessonId : null;
        res.json({
            course: {
                id: String(course._id),
                title: course.title,
                description: course.description,
            },
            lesson: {
                lessonId: lessonRecord.lesson.lessonId,
                title: lessonRecord.lesson.title,
                summary: lessonRecord.lesson.summary,
                videoUrl: lessonRecord.lesson.videoUrl,
                contentMarkdown: lessonRecord.lesson.contentMarkdown,
                quiz: lessonRecord.lesson.quiz.map((question) => ({
                    questionId: question.questionId,
                    prompt: question.prompt,
                })),
            },
            navigation: {
                previousLessonId,
                nextLessonId,
                isFinalLesson: !nextLessonId,
            },
            progress: enrollment
                ? {
                    status: enrollment.status,
                    progressPercent: enrollment.progressPercent,
                    completedLessonIds: enrollment.completedLessonIds,
                    currentLessonId: enrollment.currentLessonId,
                }
                : null,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/:courseId/lessons/:lessonId/assistant", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const courseId = toCourseId(req.params.courseId);
        if (!courseId) {
            res.status(400).json({ error: "Invalid course ID" });
            return;
        }
        const course = await Course_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const { isOwner, enrollment } = await getAccessState(userId, course);
        if (!isOwner && !enrollment) {
            res.status(403).json({ error: "Enrollment required" });
            return;
        }
        const lessonRecord = (0, courseUtils_1.findLessonById)(course, req.params.lessonId);
        if (!lessonRecord) {
            res.status(404).json({ error: "Lesson not found" });
            return;
        }
        const question = String(req.body?.question ?? "");
        const answer = (0, assistantService_1.generateLessonAssistantReply)(lessonRecord.lesson, question);
        res.json(answer);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/:courseId/lessons/:lessonId/quiz-attempts", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const courseId = toCourseId(req.params.courseId);
        if (!courseId) {
            res.status(400).json({ error: "Invalid course ID" });
            return;
        }
        const course = await Course_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const { isOwner, enrollment } = await getAccessState(userId, course);
        if (!isOwner && !enrollment) {
            res.status(403).json({ error: "Enrollment required" });
            return;
        }
        const lessonRecord = (0, courseUtils_1.findLessonById)(course, req.params.lessonId);
        if (!lessonRecord) {
            res.status(404).json({ error: "Lesson not found" });
            return;
        }
        const answers = Array.isArray(req.body?.answers)
            ? req.body.answers
            : [];
        const parsedAnswers = answers
            .map((entry) => ({
            questionId: String(entry?.questionId ?? ""),
            response: String(entry?.response ?? ""),
        }))
            .filter((entry) => entry.questionId.length > 0);
        const grade = (0, gradingService_1.gradeQuiz)(lessonRecord.lesson.quiz, parsedAnswers);
        const previousAttempts = await QuizAttempt_1.QuizAttempt.countDocuments({
            userId,
            courseId: course._id,
            lessonId: lessonRecord.lesson.lessonId,
        });
        const attemptNumber = previousAttempts + 1;
        const attempt = await QuizAttempt_1.QuizAttempt.create({
            userId,
            courseId: course._id,
            lessonId: lessonRecord.lesson.lessonId,
            attemptNumber,
            answers: parsedAnswers,
            score: grade.score,
            passed: grade.passed,
            feedback: grade.feedback,
        });
        let enrollmentRecord = enrollment;
        if (!enrollmentRecord) {
            enrollmentRecord = await ensureEnrollment(userId, course);
        }
        let nextLessonId = (0, courseUtils_1.getNextLessonId)(course, lessonRecord.lesson.lessonId);
        let lessonCompleted = false;
        let courseReadyToComplete = false;
        if (grade.passed) {
            lessonCompleted = true;
            if (!enrollmentRecord.completedLessonIds.includes(lessonRecord.lesson.lessonId)) {
                enrollmentRecord.completedLessonIds.push(lessonRecord.lesson.lessonId);
            }
            const totalLessons = (0, courseUtils_1.getTotalLessonCount)(course);
            const completedCount = enrollmentRecord.completedLessonIds.length;
            enrollmentRecord.progressPercent = (0, courseUtils_1.computeProgressPercent)(completedCount, totalLessons);
            enrollmentRecord.currentLessonId = nextLessonId ?? lessonRecord.lesson.lessonId;
            if (!nextLessonId) {
                courseReadyToComplete = completedCount >= totalLessons;
            }
            await enrollmentRecord.save();
        }
        res.json({
            attemptId: String(attempt._id),
            attemptNumber,
            score: grade.score,
            passThreshold: gradingService_1.PASS_THRESHOLD,
            passed: grade.passed,
            feedback: grade.feedback,
            lessonCompleted,
            nextLessonId,
            courseReadyToComplete,
            progressPercent: enrollmentRecord.progressPercent,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/:courseId/complete", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const courseId = toCourseId(req.params.courseId);
        if (!courseId) {
            res.status(400).json({ error: "Invalid course ID" });
            return;
        }
        const course = await Course_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const { isOwner, enrollment } = await getAccessState(userId, course);
        if (!isOwner && !enrollment) {
            res.status(403).json({ error: "Enrollment required" });
            return;
        }
        const enrollmentRecord = enrollment ?? (await ensureEnrollment(userId, course));
        const totalLessons = (0, courseUtils_1.getTotalLessonCount)(course);
        if (enrollmentRecord.completedLessonIds.length < totalLessons) {
            res.status(400).json({ error: "Complete all lessons before finishing the course" });
            return;
        }
        enrollmentRecord.status = "completed";
        enrollmentRecord.progressPercent = 100;
        await enrollmentRecord.save();
        let certificate = await Certificate_1.Certificate.findOne({
            userId,
            courseId: course._id,
        });
        if (!certificate) {
            const user = await User_1.User.findById(userId);
            if (!user) {
                res.status(404).json({ error: "User not found" });
                return;
            }
            const generated = await (0, certificateService_1.generateCertificateFile)(user, course);
            certificate = await Certificate_1.Certificate.create({
                userId,
                courseId: course._id,
                certificateNumber: generated.certificateNumber,
                issuedAt: generated.issuedAt,
                pdfPath: generated.pdfPath,
                fileName: generated.fileName,
            });
        }
        res.json({
            completedAt: enrollmentRecord.updatedAt,
            certificate: {
                id: String(certificate._id),
                certificateNumber: certificate.certificateNumber,
                issuedAt: certificate.issuedAt,
                fileName: certificate.fileName,
                downloadUrl: `/courses/${course._id}/certificate/download`,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/:courseId/certificate", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const courseId = toCourseId(req.params.courseId);
        if (!courseId) {
            res.status(400).json({ error: "Invalid course ID" });
            return;
        }
        const course = await Course_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const { isOwner, enrollment } = await getAccessState(userId, course);
        if (!isOwner && !enrollment) {
            res.status(403).json({ error: "Enrollment required" });
            return;
        }
        const certificate = await Certificate_1.Certificate.findOne({ userId, courseId: course._id });
        if (!certificate) {
            res.status(404).json({ error: "Certificate not found" });
            return;
        }
        res.json({
            certificate: {
                id: String(certificate._id),
                certificateNumber: certificate.certificateNumber,
                issuedAt: certificate.issuedAt,
                fileName: certificate.fileName,
                downloadUrl: `/courses/${course._id}/certificate/download`,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/:courseId/certificate/download", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const courseId = toCourseId(req.params.courseId);
        if (!courseId) {
            res.status(400).json({ error: "Invalid course ID" });
            return;
        }
        const course = await Course_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        const { isOwner, enrollment } = await getAccessState(userId, course);
        if (!isOwner && !enrollment) {
            res.status(403).json({ error: "Enrollment required" });
            return;
        }
        const certificate = await Certificate_1.Certificate.findOne({ userId, courseId: course._id });
        if (!certificate) {
            res.status(404).json({ error: "Certificate not found" });
            return;
        }
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${certificate.fileName}"`);
        res.sendFile(certificate.pdfPath);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.patch("/:courseId/publish", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const courseId = toCourseId(req.params.courseId);
        if (!courseId) {
            res.status(400).json({ error: "Invalid course ID" });
            return;
        }
        const course = await Course_1.Course.findById(courseId);
        if (!course) {
            res.status(404).json({ error: "Course not found" });
            return;
        }
        if (String(course.ownerId) !== userId) {
            res.status(403).json({ error: "Only owner can publish this course" });
            return;
        }
        const desired = String(req.body?.visibility ?? "");
        if (desired !== "draft" && desired !== "published") {
            res.status(400).json({ error: "Invalid visibility value" });
            return;
        }
        course.visibility = desired;
        await course.save();
        const enrollment = await Enrollment_1.Enrollment.findOne({ userId, courseId: course._id });
        res.json({
            course: buildCourseSummary(course, enrollment),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/mine/list", auth_1.requireAuth, async (req, res) => {
    try {
        const { userId } = req.jwtUser;
        const courses = await Course_1.Course.find({ ownerId: userId }).sort({ updatedAt: -1 });
        const courseIds = courses.map((course) => course._id);
        const enrollments = await Enrollment_1.Enrollment.find({ userId, courseId: { $in: courseIds } });
        const enrollmentByCourseId = new Map();
        for (const enrollment of enrollments) {
            enrollmentByCourseId.set(String(enrollment.courseId), enrollment);
        }
        res.json({
            courses: courses.map((course) => buildCourseSummary(course, enrollmentByCourseId.get(String(course._id)) ?? null)),
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
