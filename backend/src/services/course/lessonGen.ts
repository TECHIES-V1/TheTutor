import { randomUUID } from "crypto";
import { generateText } from "ai";
import { getModel, LESSON_CONFIG } from "../../config/ai";
import type { OnboardingData } from "../../types/index";
import type { OutlineLesson, OutlineModule, CourseOutline } from "./outline";

export interface LessonContent {
  contentMarkdown: string;
  keyTakeaways: string[];
  citations: Array<{
    citationText: string;
    sourceTitle: string;
    authors: string[];
    source: string;
    citationKey: string;
  }>;
  quiz: Array<{
    questionId: string;
    prompt: string;
    expectedConcepts: string[][];
    remediationTip: string;
  }>;
  exercises: string[];
  videoSearchQueries: string[];
  estimatedMinutes: number;
}

type LessonGenre = "history" | "science" | "programming" | "mathematics" |
                   "language" | "business" | "arts" | "philosophy" | "health" | "general";

function detectGenre(topic: string, goal: string): LessonGenre {
  const text = `${topic} ${goal}`.toLowerCase();
  if (/\b(histor|civiliz|empire|dynasty|war|ancient|medieval|century|revolution|colonial|monarchy)\b/.test(text)) return "history";
  if (/\b(biology|chemistry|physics|astronom|genetic|ecology|quantum|molecule|organism)\b/.test(text)) return "science";
  if (/\b(program|coding|software|javascript|python|typescript|react|algorithm|database|api|web dev|backend|frontend)\b/.test(text)) return "programming";
  if (/\b(math|calculus|algebra|geometry|statistic|trigonometr|differential|probability|linear)\b/.test(text)) return "mathematics";
  if (/\b(language|grammar|vocabulary|writing|literature|english|spanish|french|german|chinese|japanese|essay)\b/.test(text)) return "language";
  if (/\b(business|economics|finance|accounting|marketing|management|entrepreneur|invest|startup)\b/.test(text)) return "business";
  if (/\b(music|guitar|piano|violin|painting|drawing|photography|design|art|creative|sketch|compose)\b/.test(text)) return "arts";
  if (/\b(philosoph|ethics|logic|epistemol|metaphysic|moral|argument|existential)\b/.test(text)) return "philosophy";
  if (/\b(fitness|nutrition|health|medicine|exercise|yoga|workout|anatomy|diet|wellness)\b/.test(text)) return "health";
  return "general";
}

const GENRE_CONTENT_STRUCTURE: Record<LessonGenre, string> = {
  history: `Use this narrative structure:
   - ## Context: Historical setting — who, when, where, why it matters
   - ## Key Events: What happened, in sequence — use vivid detail
   - ## Causes & Effects: Why it happened and what it led to
   - ## Perspectives: How different groups experienced or viewed it
   - ## Legacy: Long-term significance and connection to today`,
  science: `Use this structure:
   - ## Core Concept: The phenomenon or principle with precise definitions
   - ## Mechanism: How it works — underlying processes and relationships
   - ## Evidence: Key experiments or observations that established this knowledge
   - ## Real-World Applications: Where this shows up in nature, technology, medicine`,
  programming: `Use this structure:
   - ## The Problem: What challenge this concept solves and why it exists
   - ## Concept & Syntax: How it works — include annotated code examples
   - ## Implementation Walkthrough: Step-by-step practical example with code
   - ## Common Pitfalls: Errors beginners make and how to avoid them`,
  mathematics: `Use this structure:
   - ## Foundations: The definitions and prerequisites needed
   - ## Core Theorem / Rule: State it precisely, explain the intuition
   - ## Worked Examples: Solve 2–3 representative problems step by step
   - ## Problem-Solving Strategy: A repeatable process for tackling new problems`,
  language: `Use this structure:
   - ## Core Concept: The grammatical rule, vocabulary cluster, or language feature
   - ## Rules & Patterns: Explicit rules with multiple correct usage examples
   - ## Common Errors: Mistakes learners make and correct alternatives
   - ## Practice Exercises: Guided writing/speaking prompts to internalize the concept`,
  business: `Use this structure:
   - ## Framework / Model: The core business concept with clear definitions
   - ## Case Study: A real-world example showing the concept in action
   - ## Analysis: What made it succeed or fail — applying the framework
   - ## Strategic Application: How the learner can apply this in their own context`,
  arts: `Use this structure:
   - ## Theory & Context: The artistic principle, historical context, or foundational knowledge
   - ## Technique Breakdown: Step-by-step how the skill or technique is executed
   - ## Demonstration / Examples: Notable examples from masters or reference works
   - ## Creative Practice: An exercise or mini-project to apply the technique`,
  philosophy: `Use this structure:
   - ## The Question: What problem or question this philosophical topic addresses
   - ## Core Position: The main argument or school of thought — stated precisely
   - ## Supporting Arguments: The best case for this position
   - ## Objections & Replies: Major counterarguments and how proponents respond
   - ## Evaluation: The learner's opportunity to critically assess the debate`,
  health: `Use this structure:
   - ## Scientific Foundation: The anatomy, physiology, or research basis
   - ## Technique / Protocol: The specific method, exercise, or practice — step by step
   - ## Safety & Common Mistakes: What to avoid and why
   - ## Progressive Practice: How to build skill/fitness incrementally with a sample plan`,
  general: `Use the EAP pattern:
   - ## Explain: Core concept introduction with clear definitions and context
   - ## Apply: Worked examples, real-world scenarios, step-by-step walkthroughs
   - ## Practice: Self-testing activities, reflection prompts`,
};

const BLOOMS_NAMES: Record<number, string> = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Evaluate",
  6: "Create",
};

const BLOOMS_GUIDANCE: Record<number, string> = {
  1: "Focus on helping learners recall facts, terminology, and definitions. Use clear explanations with labeled diagrams/tables. Quiz questions should test recognition and recall.",
  2: "Help learners build conceptual understanding. Use analogies, examples, and explanations. Quiz questions should ask learners to explain or summarize in their own words.",
  3: "Guide learners to use concepts in new situations. Include worked examples, step-by-step walkthroughs, and hands-on scenarios. Quiz questions should present new problems to solve.",
  4: "Help learners break down concepts and examine relationships. Include comparisons, case studies, and cause-effect analysis. Quiz questions should require differentiation or examination.",
  5: "Develop learners' critical judgment. Include decision-making scenarios, trade-off analysis, and evaluation criteria. Quiz questions should ask learners to justify recommendations.",
  6: "Enable learners to produce original work. Include design challenges, open-ended projects, and synthesis tasks. Quiz questions should prompt creation or original solutions.",
};

function buildLessonPrompt(
  lesson: OutlineLesson,
  module: OutlineModule,
  outline: CourseOutline,
  onboardingData: OnboardingData,
  sourceReferences: Array<{ title: string; authors: string[]; source: string }>,
  previousLessonTitles: string[]
): string {
  const { level, goal } = onboardingData;
  const genre = detectGenre(onboardingData.topic || "", goal || "");
  const contentStructure = GENRE_CONTENT_STRUCTURE[genre];
  const bloomsName = BLOOMS_NAMES[lesson.bloomsLevel] || "Understand";
  const bloomsGuide = BLOOMS_GUIDANCE[lesson.bloomsLevel] || BLOOMS_GUIDANCE[2];

  const sourcesBlock =
    sourceReferences.length > 0
      ? sourceReferences
          .map((r, i) => `${i + 1}. "${r.title}" by ${r.authors.join(", ") || "Unknown"} (source: ${r.source || "general"})`)
          .join("\n")
      : "No specific sources — draw from general domain knowledge.";

  const prevContext =
    previousLessonTitles.length > 0
      ? `Previously covered: ${previousLessonTitles.join(", ")}.`
      : "This is the first lesson in the course.";

  return `You are an expert educator writing lesson content. Respond ONLY with a valid JSON object — no markdown fences, no explanation.

COURSE CONTEXT:
- Course: "${outline.title}"
- Level: ${level || "beginner"}
- Learner goal: ${goal || "build practical understanding"}

MODULE ${module.order}: "${module.title}"
- Module description: ${module.description}
- Bloom's range for this module: levels ${module.bloomsRange[0]}-${module.bloomsRange[1]}

THIS LESSON:
- Module ${module.order}, Lesson ${lesson.order} of ${module.lessons.length}: "${lesson.title}"
- Summary: ${lesson.summary}
- Estimated time: ${lesson.estimatedMinutes} minutes
- Bloom's Level: ${lesson.bloomsLevel} — ${bloomsName}
- Primary action verb: "${lesson.bloomsVerb}"
${prevContext}

BLOOM'S LEVEL GUIDANCE (Level ${lesson.bloomsLevel} — ${bloomsName}):
${bloomsGuide}

AVAILABLE SOURCES (for citations):
${sourcesBlock}

CONTENT REQUIREMENTS:
1. contentMarkdown: Minimum 1500 words. ${contentStructure}
   Use appropriate ## and ### headings. Write for the "${level || "beginner"}" level.

2. keyTakeaways: 3-5 bullet points summarizing the most important concepts.

3. citations: 1-3 citations from the sources list above (use real titles from the list).
   If no sources available, use an empty array.

4. quiz: 2-3 open-ended questions aligned to Bloom's Level ${lesson.bloomsLevel} (${bloomsName}).
   Questions must require students to "${lesson.bloomsVerb}", not just recall.
   expectedConcepts: array of concept groups (each group is an array of synonymous terms).
   remediationTip: specific section of this lesson to review if wrong.

5. exercises: 1-2 practical tasks that push toward Bloom's Level ${Math.min(lesson.bloomsLevel + 1, 6)}.

6. videoSearchQueries: 1-2 specific YouTube search queries for this lesson topic.

7. estimatedMinutes: estimated reading + practice time in minutes.

Respond with EXACTLY this JSON shape (no other text):
{
  "contentMarkdown": "Full lesson content in Markdown. Min 1500 words.",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "citations": [
    {
      "citationText": "Author, A. (Year). *Title*. Publisher.",
      "sourceTitle": "Exact title from sources list",
      "authors": ["Author Name"],
      "source": "source identifier",
      "citationKey": "short-key"
    }
  ],
  "quiz": [
    {
      "questionId": "q1",
      "prompt": "Question requiring Bloom's level ${lesson.bloomsLevel} thinking?",
      "expectedConcepts": [["key concept", "synonym"], ["another concept"]],
      "remediationTip": "Review the ## Explain section on [specific topic]."
    }
  ],
  "exercises": ["Practical task 1"],
  "videoSearchQueries": ["specific YouTube search query"],
  "estimatedMinutes": ${lesson.estimatedMinutes}
}`;
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
}

export async function generateLessonContent(
  lesson: OutlineLesson,
  module: OutlineModule,
  outline: CourseOutline,
  onboardingData: OnboardingData,
  sourceReferences: Array<{ title: string; authors: string[]; source: string }>,
  previousLessonTitles: string[]
): Promise<LessonContent> {
  const prompt = buildLessonPrompt(
    lesson,
    module,
    outline,
    onboardingData,
    sourceReferences,
    previousLessonTitles
  );

  const result = await generateText({
    model: getModel(),
    prompt,
    maxOutputTokens: LESSON_CONFIG.maxOutputTokens,
    temperature: LESSON_CONFIG.temperature,
  });

  const raw = stripFences(result.text);

  let parsed: {
    contentMarkdown: string;
    keyTakeaways?: string[];
    citations?: Array<{
      citationText: string;
      sourceTitle: string;
      authors: string[];
      source: string;
      citationKey: string;
    }>;
    quiz?: Array<{
      questionId?: string;
      prompt: string;
      expectedConcepts?: unknown[];
      remediationTip?: string;
    }>;
    exercises?: string[];
    videoSearchQueries?: string[];
    estimatedMinutes?: number;
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[lessonGen] Raw response (first 500):", result.text.slice(0, 500));
      throw new Error(`lesson_parse_failed: No JSON in response for "${lesson.title}"`);
    }
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("[lessonGen] JSON parse error:", e);
      throw new Error(`lesson_parse_failed: Invalid JSON for "${lesson.title}"`);
    }
  }

  const contentMarkdown = String(parsed.contentMarkdown || "").trim();
  if (contentMarkdown.length < 500) {
    throw new Error(`lesson_parse_failed: Content too short for "${lesson.title}" (${contentMarkdown.length} chars)`);
  }

  // Normalize quiz questions
  const quiz = (Array.isArray(parsed.quiz) ? parsed.quiz : [])
    .map((q) => ({
      questionId: String(q.questionId || randomUUID()),
      prompt: String(q.prompt || "").trim(),
      expectedConcepts: normalizeExpectedConcepts(q.expectedConcepts),
      remediationTip: String(q.remediationTip || "Review the lesson content.").trim(),
    }))
    .filter((q) => q.prompt.length > 0);

  return {
    contentMarkdown,
    keyTakeaways: (Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [])
      .map((t) => String(t).trim())
      .filter(Boolean),
    citations: (Array.isArray(parsed.citations) ? parsed.citations : [])
      .map((c) => ({
        citationText: String(c.citationText || "").trim(),
        sourceTitle: String(c.sourceTitle || "").trim(),
        authors: Array.isArray(c.authors) ? c.authors.map(String) : [],
        source: String(c.source || "").trim(),
        citationKey: String(c.citationKey || "").trim(),
      }))
      .filter((c) => c.citationText.length > 0),
    quiz,
    exercises: (Array.isArray(parsed.exercises) ? parsed.exercises : [])
      .map((e) => String(e).trim())
      .filter(Boolean),
    videoSearchQueries: (Array.isArray(parsed.videoSearchQueries) ? parsed.videoSearchQueries : [])
      .map((q) => String(q).trim())
      .filter(Boolean),
    estimatedMinutes: Number(parsed.estimatedMinutes) || lesson.estimatedMinutes,
  };
}

function normalizeExpectedConcepts(raw: unknown): string[][] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((group) =>
      Array.isArray(group)
        ? group.map((item) => String(item).trim()).filter(Boolean)
        : [String(group).trim()].filter(Boolean)
    )
    .filter((group) => group.length > 0);
}
