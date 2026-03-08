import { GeneratedCoursePayload, OnboardingPayload, CourseLevel } from "../types/courseContract";
import { slugify } from "./slugUtils";

interface GenerationAdapterInput {
  onboarding: OnboardingPayload;
  userName: string;
}

type GenerationSource = "generator" | "stub";

interface GenerationAdapterOutput {
  source: GenerationSource;
  course: GeneratedCoursePayload;
}

const DEFAULT_LEVEL: CourseLevel = "beginner";

function normalizeLevel(level: string | undefined): CourseLevel {
  const normalized = (level ?? "").trim().toLowerCase();
  if (normalized === "beginner" || normalized === "intermediate" || normalized === "advanced") {
    return normalized;
  }
  return DEFAULT_LEVEL;
}

function buildStubCourse(input: GenerationAdapterInput): GeneratedCoursePayload {
  const topic = input.onboarding.topic.trim() || "Foundations of Learning";
  const level = normalizeLevel(input.onboarding.level);
  const goal = input.onboarding.goal.trim() || "Build practical confidence";
  const topicSlug = slugify(topic);

  const lessons = [
    {
      lessonId: `${topicSlug}-lesson-1`,
      order: 1,
      title: `${topic}: Foundations`,
      summary: `Understand the core concepts and vocabulary for ${topic}.`,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      videoReferences: [
        {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Foundations Overview",
          channelName: "Learning Channel",
          queryUsed: `${topic} fundamentals`,
        },
      ],
      contentMarkdown: [
        `# ${topic} Foundations`,
        "",
        `This lesson introduces key ideas in **${topic}** and why they matter for your goal: _${goal}_.`,
        "",
        "## What You Will Learn",
        "- Core terminology",
        "- Basic workflow",
        "- Common beginner mistakes",
      ].join("\n"),
      citations: [
        {
          citationText: `Doe, J. (2021). *${topic} Foundations*. Open Learning Press.`,
          sourceTitle: `${topic} Foundations`,
          authors: ["Doe, J."],
          source: "openlibrary",
          citationKey: `${topic} Foundations`,
        },
      ],
      quiz: [
        {
          questionId: "q1",
          prompt: `In your own words, what is the main purpose of ${topic}?`,
          expectedConcepts: [["purpose", "goal", "outcome"], ["problem", "need", "challenge"]],
          remediationTip: "Explain what problem this topic solves and what outcome it drives.",
        },
        {
          questionId: "q2",
          prompt: `List two foundational building blocks someone should learn first in ${topic}.`,
          expectedConcepts: [["fundamental", "foundational", "core"], ["workflow", "process", "step"]],
          remediationTip: "Name concrete fundamentals and mention why they should be learned first.",
        },
      ],
    },
    {
      lessonId: `${topicSlug}-lesson-2`,
      order: 2,
      title: `${topic}: Applied Practice`,
      summary: `Use guided exercises to apply ${topic} concepts.`,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      videoReferences: [
        {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Applied Practice Walkthrough",
          channelName: "Learning Channel",
          queryUsed: `${topic} practical exercises`,
        },
      ],
      contentMarkdown: [
        `# ${topic} Applied Practice`,
        "",
        "Move from theory to action with a repeatable approach.",
        "",
        "## Practice Loop",
        "- Plan",
        "- Execute",
        "- Review",
        "- Improve",
      ].join("\n"),
      citations: [
        {
          citationText: `Smith, A. (2020). *Applied ${topic}*. Practical Learning House.`,
          sourceTitle: `Applied ${topic}`,
          authors: ["Smith, A."],
          source: "gutendex",
          citationKey: `Applied ${topic}`,
        },
      ],
      quiz: [
        {
          questionId: "q1",
          prompt: "Describe a simple practice loop you would follow this week.",
          expectedConcepts: [["plan", "planning"], ["execute", "practice", "do"], ["review", "reflect", "improve"]],
          remediationTip: "Include a sequence: plan, practice, and review/improve.",
        },
        {
          questionId: "q2",
          prompt: "How would you measure whether your practice is working?",
          expectedConcepts: [["metric", "measure", "indicator"], ["time", "consistency", "frequency"]],
          remediationTip: "Define at least one measurable metric and one time-based cadence.",
        },
      ],
    },
    {
      lessonId: `${topicSlug}-lesson-3`,
      order: 3,
      title: `${topic}: Project and Mastery`,
      summary: `Deliver a small project aligned to your goal: ${goal}.`,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      videoReferences: [
        {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "Project Planning and Mastery",
          channelName: "Learning Channel",
          queryUsed: `${topic} project tutorial`,
        },
      ],
      contentMarkdown: [
        `# ${topic} Project and Mastery`,
        "",
        "Finish with a focused project that proves practical understanding.",
        "",
        "## Final Project Checklist",
        "- Define scope",
        "- Build a working artifact",
        "- Validate outcomes",
        "- Document lessons learned",
      ].join("\n"),
      citations: [
        {
          citationText: `Lee, M. (2019). *Mastering ${topic} Projects*. Study Press.`,
          sourceTitle: `Mastering ${topic} Projects`,
          authors: ["Lee, M."],
          source: "standard-ebooks",
          citationKey: `Mastering ${topic} Projects`,
        },
      ],
      quiz: [
        {
          questionId: "q1",
          prompt: "What project will you build, and why does it match your goal?",
          expectedConcepts: [["project", "artifact"], ["goal", "outcome"], ["scope", "constraint"]],
          remediationTip: "Name the project, connect it to your goal, and describe clear scope.",
        },
        {
          questionId: "q2",
          prompt: "What will you do after finishing the project to keep improving?",
          expectedConcepts: [["feedback", "review", "reflect"], ["iterate", "improve", "next"]],
          remediationTip: "Mention how you will gather feedback and what iteration comes next.",
        },
      ],
    },
  ];

  return {
    title: `${topic} Mastery Path`,
    description: `A personalized ${level} roadmap for ${input.userName} to achieve: ${goal}.`,
    topic,
    level,
    goal,
    curriculum: [
      {
        moduleId: `${topicSlug}-module-1`,
        order: 1,
        title: `${topic} Core Path`,
        moduleQuiz: {
          quizId: `${topicSlug}-module-1-quiz`,
          title: `${topic} Core Path Checkpoint`,
          questions: [
            {
              questionId: "mq1",
              prompt: `Summarize the core workflow for ${topic}.`,
              expectedConcepts: [["workflow"], ["practice"], ["review"]],
              remediationTip: "Revisit the lesson summaries and list the core workflow steps.",
            },
          ],
        },
        lessons,
      },
    ],
  };
}

async function generateWithRemote(input: GenerationAdapterInput): Promise<GeneratedCoursePayload | null> {
  const endpoint = process.env.GENERATOR_ENDPOINT;
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onboarding: input.onboarding,
        userName: input.userName,
      }),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as GeneratedCoursePayload;
    if (!payload?.title || !Array.isArray(payload.curriculum)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function generateCourse(input: GenerationAdapterInput): Promise<GenerationAdapterOutput> {
  const mode = (process.env.GENERATION_ADAPTER_MODE ?? "stub").trim().toLowerCase();

  if (mode === "remote") {
    const remote = await generateWithRemote(input);
    if (remote) return { source: "generator", course: remote };
  }

  return { source: "stub", course: buildStubCourse(input) };
}
