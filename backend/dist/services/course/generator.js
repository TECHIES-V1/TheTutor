"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = generate;
exports.parseCourseContent = parseCourseContent;
const mongoose_1 = require("mongoose");
const Conversation_1 = require("../../models/Conversation");
const Course_1 = require("../../models/Course");
const nova_1 = require("../ai/nova");
const crypto_1 = require("crypto");
const youtube_service_1 = require("../youtube/youtube.service");
// ── Course Generator ──────────────────────────────────────────────────────
async function* generate(conversationId, userId) {
    // Load conversation
    console.log("[generator] Starting for conversationId:", conversationId, "userId:", userId);
    const conversation = await Conversation_1.Conversation.findOne({
        _id: conversationId,
        userId: new mongoose_1.Types.ObjectId(userId),
    });
    if (!conversation) {
        console.log("[generator] Conversation not found");
        yield {
            type: "error",
            data: {
                code: "MCP_UNAVAILABLE",
                message: "Conversation not found",
                retryable: false,
                phase: "resource_retrieval",
            },
        };
        return;
    }
    console.log("[generator] Conversation found. Phase:", conversation.phase, "OnboardingData:", JSON.stringify(conversation.onboardingData));
    if (conversation.phase !== "resource_retrieval") {
        console.log("[generator] PHASE MISMATCH — expected resource_retrieval, got:", conversation.phase);
        yield {
            type: "error",
            data: {
                code: "MCP_UNAVAILABLE",
                message: `Invalid conversation phase: ${conversation.phase}. Expected: resource_retrieval`,
                retryable: false,
                phase: "resource_retrieval",
            },
        };
        return;
    }
    const onboardingData = {
        topic: conversation.onboardingData.topic,
        level: conversation.onboardingData.level,
        hoursPerWeek: conversation.onboardingData.hoursPerWeek,
        goal: conversation.onboardingData.goal,
        confirmedSubject: conversation.onboardingData.confirmedSubject,
    };
    // Update conversation phase
    conversation.phase = "course_generation";
    await conversation.save();
    try {
        // Create initial course document
        const course = new Course_1.Course({
            userId: new mongoose_1.Types.ObjectId(userId),
            conversationId: new mongoose_1.Types.ObjectId(conversationId),
            title: onboardingData.confirmedSubject || onboardingData.topic || "New Course",
            description: "",
            subject: onboardingData.confirmedSubject || onboardingData.topic || "",
            level: onboardingData.level || "beginner",
            status: "generating",
            modules: [],
            estimatedHours: 0,
            resources: [], // Will be updated if we track parsed books via tool results
            progress: {
                completedLessons: 0,
                totalLessons: 0,
                percentComplete: 0,
            },
        });
        await course.save();
        yield {
            type: "status",
            data: {
                phase: "course_generation",
                message: "AI is searching for resources...",
                progress: 10,
            },
        };
        // Stream with tools - AI drives the process
        const resourceIds = [];
        let courseContent = "";
        for await (const event of (0, nova_1.streamCourseWithMCPTools)(onboardingData, course._id.toString(), userId)) {
            // Collect resource IDs from tool results if we have them
            if (event.type === "tool_result" && event.data.toolName === "fetch_and_parse_book") {
                // We'll leave this as a hook if we add resource ID tracking later
                // resourceIds.push(event.data.resourceId);
            }
            if (event.type === "course_chunk") {
                courseContent += event.data.content;
            }
            yield event;
        }
        // Finalize: parse content into modules, save course
        yield {
            type: "status",
            data: {
                phase: "course_generation",
                message: "Finalizing course structure...",
                progress: 95,
            },
        };
        const parsedCourse = parseCourseContent(courseContent);
        // Fetch actual YouTube videos for all lessons
        yield {
            type: "status",
            data: {
                phase: "course_generation",
                message: "Fetching YouTube video resources...",
                progress: 98,
            },
        };
        for (const module of parsedCourse.modules) {
            for (const lesson of module.lessons) {
                if (lesson.videoSearchQueries && lesson.videoSearchQueries.length > 0) {
                    lesson.videoLinks = await (0, youtube_service_1.fetchVideoLinksForQueries)(lesson.videoSearchQueries);
                }
            }
        }
        // Update course with parsed content
        course.title = parsedCourse.title || course.title;
        course.description = parsedCourse.description;
        course.modules = parsedCourse.modules;
        course.estimatedHours = parsedCourse.estimatedHours;
        course.status = "active";
        course.progress.totalLessons = parsedCourse.totalLessons;
        await course.save();
        // Update conversation
        conversation.phase = "completed";
        conversation.status = "completed";
        conversation.courseId = course._id;
        await conversation.save();
        // Emit completion event
        yield {
            type: "complete",
            data: {
                courseId: course._id.toString(),
                title: course.title,
                description: course.description,
                moduleCount: course.modules.length,
                lessonCount: parsedCourse.totalLessons,
                estimatedHours: course.estimatedHours,
            },
        };
    }
    catch (error) {
        console.error("Course generation error:", error);
        // Reset conversation phase on error
        conversation.phase = "resource_retrieval";
        await conversation.save();
        yield {
            type: "error",
            data: {
                code: "AI_ERROR",
                message: error instanceof Error ? error.message : "Course generation failed",
                retryable: true,
                phase: "course_generation",
            },
        };
    }
}
function parseCourseContent(content) {
    const result = {
        title: "",
        description: "",
        modules: [],
        totalLessons: 0,
        estimatedHours: 0,
    };
    // Extract title (# Course: ...)
    const titleMatch = content.match(/^#\s*Course:\s*(.+)$/m);
    if (titleMatch) {
        result.title = titleMatch[1].trim();
    }
    // Extract description (## Description followed by text)
    const descMatch = content.match(/##\s*Description\s*\n([\s\S]*?)(?=##\s*Module|\n##|$)/);
    if (descMatch) {
        result.description = descMatch[1].trim();
    }
    // Parse modules
    const moduleRegex = /##\s*Module\s*(\d+):\s*(.+)\n([\s\S]*?)(?=##\s*Module\s*\d+:|$)/g;
    let moduleMatch;
    let moduleOrder = 0;
    while ((moduleMatch = moduleRegex.exec(content)) !== null) {
        const moduleTitle = moduleMatch[2].trim();
        const moduleContent = moduleMatch[3];
        // Extract module description (first paragraph before lessons)
        const moduleDescMatch = moduleContent.match(/^([\s\S]*?)(?=###\s*Lesson)/);
        const moduleDescription = moduleDescMatch
            ? moduleDescMatch[1].trim()
            : "";
        const module = {
            id: (0, crypto_1.randomUUID)(),
            title: moduleTitle,
            description: moduleDescription,
            order: moduleOrder++,
            completed: false,
            lessons: [],
        };
        // Parse lessons within module
        const lessonRegex = /###\s*Lesson\s*[\d.]+:\s*(.+)\n([\s\S]*?)(?=###\s*Lesson|##\s*Module|$)/g;
        let lessonMatch;
        let lessonOrder = 0;
        while ((lessonMatch = lessonRegex.exec(moduleContent)) !== null) {
            const lessonTitle = lessonMatch[1].trim();
            const lessonContent = lessonMatch[2];
            // Extract estimated time
            const timeMatch = lessonContent.match(/\*\*Estimated Time\*\*:\s*(\d+)\s*minutes?/i);
            const estimatedMinutes = timeMatch ? parseInt(timeMatch[1], 10) : 15;
            // Extract description
            const descLineMatch = lessonContent.match(/\*\*Description\*\*:\s*(.+)/);
            const lessonDescription = descLineMatch ? descLineMatch[1].trim() : "";
            // Extract main content (everything after Content: until Key Takeaways, Videos, Quiz, Exercises, or end)
            const contentMatch = lessonContent.match(/\*\*Content\*\*:\s*([\s\S]*?)(?=\*\*Key Takeaways\*\*:|\*\*Videos\*\*:|\*\*Quiz\*\*:|\*\*Exercises\*\*:|$)/);
            const mainContent = contentMatch ? contentMatch[1].trim() : lessonContent;
            // Extract video search queries
            const videoSearchQueries = [];
            const videosSectionMatch = lessonContent.match(/\*\*Videos\*\*:\s*([\s\S]*?)(?=\*\*Quiz\*\*:|\*\*Exercises\*\*:|$)/);
            if (videosSectionMatch) {
                const videosSection = videosSectionMatch[1];
                const searchRegex = /\[Search:\s*"(.*?)"\]/g;
                let searchMatch;
                while ((searchMatch = searchRegex.exec(videosSection)) !== null) {
                    videoSearchQueries.push(searchMatch[1].trim());
                }
            }
            // Extract quizzes
            const quizzes = [];
            const quizSectionMatch = lessonContent.match(/\*\*Quiz\*\*:\s*```(?:json)?\s*([\s\S]*?)\s*```/);
            if (quizSectionMatch) {
                try {
                    const parsedQuestions = JSON.parse(quizSectionMatch[1]);
                    if (Array.isArray(parsedQuestions)) {
                        const questions = parsedQuestions.map((q) => ({
                            id: q.id || (0, crypto_1.randomUUID)(),
                            type: (q.type === "open_ended" ? "open_ended" : "multiple_choice"),
                            question: q.question || "",
                            options: q.options || [],
                            correctAnswerIndex: q.correctAnswerIndex,
                            correctAnswerText: q.correctAnswerText,
                            explanation: q.explanation || "",
                            isAnsweredCorrectly: false,
                        }));
                        if (questions.length > 0) {
                            quizzes.push({
                                id: (0, crypto_1.randomUUID)(),
                                title: "Lesson Quiz",
                                questions,
                                isCompleted: false,
                            });
                        }
                    }
                }
                catch (error) {
                    console.error("Failed to parse quiz JSON for lesson:", lessonTitle, error);
                }
            }
            // Extract exercises/interactive elements
            const interactiveElements = [];
            const exercisesSectionMatch = lessonContent.match(/\*\*Exercises\*\*:\s*([\s\S]*?)(?=(?:###|##|$))/);
            if (exercisesSectionMatch) {
                const exercisesContent = exercisesSectionMatch[1].trim();
                if (exercisesContent) {
                    interactiveElements.push({
                        id: (0, crypto_1.randomUUID)(),
                        type: "exercise",
                        content: exercisesContent,
                        isCompleted: false,
                    });
                }
            }
            const lesson = {
                id: (0, crypto_1.randomUUID)(),
                title: lessonTitle,
                description: lessonDescription,
                content: mainContent,
                estimatedMinutes,
                videoLinks: [],
                videoSearchQueries,
                quizzes,
                interactiveElements,
                resources: [],
                completed: false,
                order: lessonOrder++,
            };
            module.lessons.push(lesson);
            result.totalLessons++;
            result.estimatedHours += estimatedMinutes / 60;
        }
        result.modules.push(module);
    }
    // Round estimated hours
    result.estimatedHours = Math.round(result.estimatedHours * 10) / 10;
    return result;
}
