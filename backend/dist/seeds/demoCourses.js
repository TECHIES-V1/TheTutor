"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDemoCourses = seedDemoCourses;
const Course_1 = require("../models/Course");
const User_1 = require("../models/User");
function isSeedingEnabled() {
    const raw = String(process.env.SEED_DEMO_COURSES ?? "true").trim().toLowerCase();
    return !["0", "false", "off", "no"].includes(raw);
}
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
}
function buildLesson(courseSlug, moduleOrder, lessonOrder, title, summary, focus, goal) {
    const lessonId = `${courseSlug}-m${moduleOrder}-l${lessonOrder}`;
    return {
        lessonId,
        order: lessonOrder,
        title,
        summary,
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        contentMarkdown: [
            `# ${title}`,
            "",
            summary,
            "",
            "## Lesson Focus",
            `- ${focus}`,
            "- Practical execution over theory",
            `- Directly support this goal: ${goal}`,
            "",
            "## Practice Exercise",
            `Apply this lesson to one real task connected to: ${goal}.`,
        ].join("\n"),
        quiz: [
            {
                questionId: `${lessonId}-q1`,
                prompt: `Why does ${focus.toLowerCase()} matter for this goal: ${goal}?`,
                expectedConcepts: [
                    ["goal", "outcome", "impact"],
                    ["focus", "strategy", "approach"],
                ],
                remediationTip: "Connect the lesson focus to a concrete outcome you want to achieve.",
            },
            {
                questionId: `${lessonId}-q2`,
                prompt: "Name one action you can take immediately after this lesson.",
                expectedConcepts: [
                    ["action", "step", "next"],
                    ["apply", "practice", "implement"],
                ],
                remediationTip: "Give one specific action and explain how you would apply it this week.",
            },
        ],
    };
}
function buildCurriculum(topic, goal) {
    const courseSlug = slugify(topic);
    const moduleSpecs = [
        {
            title: `${topic} Foundations`,
            lessons: [
                {
                    title: `${topic} Core Concepts`,
                    summary: `Build a shared vocabulary and understand the core mechanics behind ${topic}.`,
                    focus: "core concepts and vocabulary",
                },
                {
                    title: `${topic} Workflow Setup`,
                    summary: `Set up a repeatable workflow so you can move from learning to execution quickly.`,
                    focus: "repeatable workflow design",
                },
            ],
        },
        {
            title: `${topic} Applied Execution`,
            lessons: [
                {
                    title: `${topic} Guided Project`,
                    summary: "Use a step-by-step project to turn understanding into practical output.",
                    focus: "project execution and scope control",
                },
                {
                    title: `${topic} Review and Optimization`,
                    summary: "Measure results, identify bottlenecks, and iterate for better outcomes.",
                    focus: "measurement, feedback, and iteration",
                },
            ],
        },
    ];
    return moduleSpecs.map((module, moduleIndex) => ({
        moduleId: `${courseSlug}-module-${moduleIndex + 1}`,
        order: moduleIndex + 1,
        title: module.title,
        lessons: module.lessons.map((lesson, lessonIndex) => buildLesson(courseSlug, moduleIndex + 1, lessonIndex + 1, lesson.title, lesson.summary, lesson.focus, goal)),
    }));
}
const DEMO_OWNERS = [
    {
        googleId: "demo-owner-maya",
        email: "maya.demo@thetutor.local",
        name: "Maya Patel",
        image: "https://i.pravatar.cc/128?img=21",
    },
    {
        googleId: "demo-owner-jordan",
        email: "jordan.demo@thetutor.local",
        name: "Jordan Lee",
        image: "https://i.pravatar.cc/128?img=13",
    },
    {
        googleId: "demo-owner-sofia",
        email: "sofia.demo@thetutor.local",
        name: "Sofia Garcia",
        image: "https://i.pravatar.cc/128?img=44",
    },
];
const DEMO_COURSES = [
    {
        ownerGoogleId: "demo-owner-maya",
        title: "Python Automation for Busy Professionals",
        description: "A practical beginner path to automate repetitive work tasks with Python and save weekly time.",
        topic: "Python Automation",
        level: "beginner",
        goal: "save at least five hours per week on repetitive tasks",
        curriculum: buildCurriculum("Python Automation", "save at least five hours per week on repetitive tasks"),
    },
    {
        ownerGoogleId: "demo-owner-jordan",
        title: "SQL Dashboards for Product Teams",
        description: "Build reliable SQL queries and turn them into clear dashboard stories for weekly product decisions.",
        topic: "SQL Analytics Dashboards",
        level: "intermediate",
        goal: "ship a weekly product dashboard that stakeholders trust",
        curriculum: buildCurriculum("SQL Analytics Dashboards", "ship a weekly product dashboard that stakeholders trust"),
    },
    {
        ownerGoogleId: "demo-owner-sofia",
        title: "Systematic Product Interview Prep",
        description: "An advanced prep track for product interviews with repeatable frameworks and execution drills.",
        topic: "Product Interview Preparation",
        level: "advanced",
        goal: "perform consistently in product manager interview loops",
        curriculum: buildCurriculum("Product Interview Preparation", "perform consistently in product manager interview loops"),
    },
];
async function upsertDemoOwner(owner) {
    const record = await User_1.User.findOneAndUpdate({ googleId: owner.googleId }, {
        $setOnInsert: {
            googleId: owner.googleId,
            email: owner.email,
            onboardingCompleted: true,
        },
        $set: {
            name: owner.name,
            image: owner.image,
        },
    }, {
        upsert: true,
        new: true,
    });
    if (!record) {
        throw new Error(`Failed to create demo owner: ${owner.googleId}`);
    }
    return record;
}
async function seedDemoCourses() {
    if (!isSeedingEnabled()) {
        console.log("Skipping demo course seed (SEED_DEMO_COURSES disabled).");
        return;
    }
    const ownersByGoogleId = new Map();
    for (const owner of DEMO_OWNERS) {
        const upserted = await upsertDemoOwner(owner);
        ownersByGoogleId.set(owner.googleId, upserted);
    }
    for (const course of DEMO_COURSES) {
        const owner = ownersByGoogleId.get(course.ownerGoogleId);
        if (!owner)
            continue;
        await Course_1.Course.findOneAndUpdate({
            ownerId: owner._id,
            title: course.title,
        }, {
            ownerId: owner._id,
            ownerName: owner.name,
            title: course.title,
            description: course.description,
            topic: course.topic,
            level: course.level,
            goal: course.goal,
            visibility: "published",
            accessModel: "free_hackathon",
            generationStatus: "ready",
            createdBy: "stub",
            curriculum: course.curriculum,
        }, {
            upsert: true,
            new: true,
        });
    }
    console.log(`Demo seed complete: ${DEMO_COURSES.length} published courses ready for Explore.`);
}
