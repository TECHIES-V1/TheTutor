import { randomUUID } from "crypto";
import { generateText } from "ai";
import { getModel, OUTLINE_CONFIG } from "../../config/ai";
import type { OnboardingData } from "../../types/index";

export interface OutlineLesson {
  lessonId: string;
  order: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
  bloomsLevel: 1 | 2 | 3 | 4 | 5 | 6;
  bloomsVerb: string;
}

export interface OutlineModule {
  moduleId: string;
  order: number;
  title: string;
  description: string;
  bloomsRange: [number, number];
  lessons: OutlineLesson[];
}

export interface CourseOutline {
  title: string;
  description: string;
  estimatedTotalHours: number;
  targetAudience: string;
  modules: OutlineModule[];
}

const BLOOMS_LEVELS: Record<number, string> = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Evaluate",
  6: "Create",
};

function buildOutlinePrompt(
  onboardingData: OnboardingData,
  sourceReferences: Array<{ title: string; authors: string[]; source: string }>
): string {
  const { confirmedSubject, topic, level, hoursPerWeek, goal } = onboardingData;
  const subject = confirmedSubject || topic || "the requested subject";

  const sourcesBlock =
    sourceReferences.length > 0
      ? sourceReferences
          .map((r) => `- "${r.title}" by ${r.authors.join(", ") || "Unknown"}`)
          .join("\n")
      : "No specific sources available — use general domain knowledge.";

  return `You are an expert curriculum designer. Respond ONLY with a valid JSON object — no markdown fences, no explanation, no extra text.

Design a complete course outline for:
- Subject: ${subject}
- Level: ${level || "beginner"}
- Weekly time available: ${hoursPerWeek || 5} hours
- Learning goal: ${goal || "build practical understanding"}

Available reference materials:
${sourcesBlock}

CRITICAL RULES:
1. Determine the number of modules and lessons based on the topic's complexity and the learner's goal. There are NO fixed limits.
   - A narrow skill (e.g. "Git branching") may need 3 modules with 2-3 lessons each.
   - A comprehensive subject (e.g. "Machine Learning") may need 8-12 modules with 3-4 lessons each.
   - Calibrate total hours to the learner's weekly availability: ${hoursPerWeek || 5} hrs/week.
2. Every lesson must have a Bloom's Taxonomy level (1-6) and a matching action verb:
   - Level 1 (Remember): recall, list, identify, name
   - Level 2 (Understand): explain, summarize, describe, interpret
   - Level 3 (Apply): use, demonstrate, solve, implement
   - Level 4 (Analyze): compare, examine, differentiate, break down
   - Level 5 (Evaluate): justify, critique, recommend, assess
   - Level 6 (Create): design, build, produce, develop
3. Modules should generally progress from lower Bloom's levels (1-2) to higher (4-6).
4. Each module's bloomsRange should reflect the min and max Bloom's level of its lessons.

Respond with EXACTLY this JSON shape:
{
  "title": "string",
  "description": "string (2-3 sentences about what the course covers)",
  "estimatedTotalHours": number,
  "targetAudience": "string (1 sentence)",
  "modules": [
    {
      "order": 1,
      "title": "string",
      "description": "string (1-2 sentences about this module)",
      "bloomsRange": [minLevel, maxLevel],
      "lessons": [
        {
          "order": 1,
          "title": "string",
          "summary": "string (1-2 sentences about what this lesson covers)",
          "estimatedMinutes": 25,
          "bloomsLevel": 2,
          "bloomsVerb": "explain"
        }
      ]
    }
  ]
}`;
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
}

export async function generateCourseOutline(
  onboardingData: OnboardingData,
  sourceReferences: Array<{ title: string; authors: string[]; source: string }>
): Promise<CourseOutline> {
  const prompt = buildOutlinePrompt(onboardingData, sourceReferences);

  const result = await generateText({
    model: getModel(),
    prompt,
    maxOutputTokens: OUTLINE_CONFIG.maxOutputTokens,
    temperature: OUTLINE_CONFIG.temperature,
  });

  const raw = stripFences(result.text);

  let parsed: {
    title: string;
    description: string;
    estimatedTotalHours: number;
    targetAudience: string;
    modules: Array<{
      order: number;
      title: string;
      description: string;
      bloomsRange: [number, number];
      lessons: Array<{
        order: number;
        title: string;
        summary: string;
        estimatedMinutes: number;
        bloomsLevel: number;
        bloomsVerb: string;
      }>;
    }>;
  };

  try {
    // Try direct parse first
    parsed = JSON.parse(raw);
  } catch {
    // Try extracting JSON object from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[outline] Raw AI response:", result.text.slice(0, 500));
      throw new Error("outline_parse_failed: No JSON object found in response");
    }
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("[outline] JSON parse error:", e);
      throw new Error("outline_parse_failed: Invalid JSON in response");
    }
  }

  if (!parsed.modules || !Array.isArray(parsed.modules) || parsed.modules.length === 0) {
    throw new Error("outline_parse_failed: No modules in outline");
  }

  // Assign UUIDs and normalize (AI returns order/title/etc, we add IDs here)
  const outline: CourseOutline = {
    title: String(parsed.title || "").trim(),
    description: String(parsed.description || "").trim(),
    estimatedTotalHours: Number(parsed.estimatedTotalHours) || 0,
    targetAudience: String(parsed.targetAudience || "").trim(),
    modules: parsed.modules.map((mod, modIdx) => {
      const bloomsRange: [number, number] = Array.isArray(mod.bloomsRange) && mod.bloomsRange.length >= 2
        ? [Math.max(1, Math.min(6, Number(mod.bloomsRange[0]))), Math.max(1, Math.min(6, Number(mod.bloomsRange[1])))]
        : [1, 3];

      return {
        moduleId: randomUUID(),
        order: Number(mod.order) || modIdx + 1,
        title: String(mod.title || "").trim(),
        description: String(mod.description || "").trim(),
        bloomsRange,
        lessons: (Array.isArray(mod.lessons) ? mod.lessons : []).map((lesson, lesIdx) => {
          const rawLevel = Number(lesson.bloomsLevel);
          const bloomsLevel = (Number.isFinite(rawLevel) && rawLevel >= 1 && rawLevel <= 6
            ? rawLevel
            : 1) as 1 | 2 | 3 | 4 | 5 | 6;

          return {
            lessonId: randomUUID(),
            order: Number(lesson.order) || lesIdx + 1,
            title: String(lesson.title || "").trim(),
            summary: String(lesson.summary || "").trim(),
            estimatedMinutes: Number(lesson.estimatedMinutes) || 25,
            bloomsLevel,
            bloomsVerb: String(lesson.bloomsVerb || BLOOMS_LEVELS[bloomsLevel] || "learn").trim(),
          };
        }),
      };
    }),
  };

  console.log(
    `[outline] Generated: "${outline.title}" — ${outline.modules.length} modules, ` +
    `${outline.modules.reduce((sum, m) => sum + m.lessons.length, 0)} lessons`
  );

  return outline;
}
