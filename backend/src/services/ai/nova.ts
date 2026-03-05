import { generateText, streamText, stepCountIs } from "ai";
import type { ModelMessage } from "ai";
import { getModel, GENERATION_CONFIG, STREAMING_CONFIG, MCP_DISCOVERY_CONFIG } from "../../config/ai";
import {
  getOnboardingSystemPrompt,
  getBookFilteringPrompt,
  getSubjectFromConversationPrompt,
  getOnboardingDataExtractionPrompt,
  getToolAwareGenerationPrompt,
} from "./prompts";
import type {
  OnboardingData,
  ExperienceLevel,
  DiscoveredBook,
  SSEEvent,
} from "../../types";
import type { IMessage } from "../../models/Conversation";
import { getMCPTools, closeMCPClient } from "../mcp/mcpClient";

// ── Chat (Non-streaming for onboarding) ───────────────────────────────────

export async function chat(
  messages: ModelMessage[],
  messagesLeft: number
): Promise<string> {
  const result = await generateText({
    model: getModel(),
    system: getOnboardingSystemPrompt(messagesLeft),
    messages,
    maxOutputTokens: GENERATION_CONFIG.maxOutputTokens,
    temperature: GENERATION_CONFIG.temperature,
  });

  return result.text;
}

// ── Generate Subject Name from Conversation ───────────────────────────────

export async function generateSubjectFromConversation(messages: IMessage[]): Promise<string> {
  const conversationText = messages
    .map((m) => `${m.role === "user" ? "Learner" : "Tutor"}: ${m.content}`)
    .join("\n");

  const result = await generateText({
    model: getModel(),
    prompt: getSubjectFromConversationPrompt(conversationText),
    maxOutputTokens: 64,
    temperature: 0.7,
  });

  return result.text.trim().replace(/^["']|["']$/g, "");
}

// ── Extract Onboarding Data from Conversation ─────────────────────────────

export async function extractOnboardingDataFromConversation(messages: IMessage[]): Promise<{
  level: ExperienceLevel;
  hoursPerWeek: number;
  goal: string;
}> {
  const conversationText = messages
    .map((m) => `${m.role === "user" ? "Learner" : "Tutor"}: ${m.content}`)
    .join("\n");

  const result = await generateText({
    model: getModel(),
    prompt: getOnboardingDataExtractionPrompt(conversationText),
    maxOutputTokens: 128,
    temperature: 0.3,
  });

  try {
    const match = result.text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {
    console.error("Failed to parse onboarding data extraction:", result.text);
  }

  return { level: "beginner", hoursPerWeek: 5, goal: "build practical skills" };
}

// ── Filter Books ──────────────────────────────────────────────────────────

export async function filterBooks(
  topic: string,
  level: string,
  books: DiscoveredBook[]
): Promise<number[]> {
  const prompt = getBookFilteringPrompt(
    topic,
    level,
    books.map((b) => ({
      title: b.title,
      authors: b.authors,
      description: b.description,
    }))
  );

  const result = await generateText({
    model: getModel(),
    prompt,
    maxOutputTokens: 128,
    temperature: GENERATION_CONFIG.temperature,
  });

  try {
    // Extract JSON array from the response
    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const indices = JSON.parse(jsonMatch[0]) as number[];
      // Convert 1-based to 0-based indices
      return indices.map((i) => i - 1).filter((i) => i >= 0 && i < books.length);
    }
    return [];
  } catch {
    console.error("Failed to parse book filter result:", result.text);
    return [];
  }
}

// ── Stream Course Generation ──────────────────────────────────────────────

export async function* streamCourseWithMCPTools(
  onboardingData: OnboardingData,
  courseId: string,
  userId: string
): AsyncGenerator<SSEEvent> {
  // Get tools directly from MCP server
  const mcpTools = await getMCPTools();

  const result = streamText({
    model: getModel(),
    system: getToolAwareGenerationPrompt(onboardingData),
    prompt: `Create a comprehensive course on "${onboardingData.confirmedSubject}" for a ${onboardingData.level} learner.`,
    tools: mcpTools,  // MCP tools auto-converted to AI SDK tools
    stopWhen: stepCountIs(10), // Max 10 tool call rounds
    maxOutputTokens: STREAMING_CONFIG.maxOutputTokens,
    onFinish: async () => {
      await closeMCPClient();
    },
  });

  for await (const chunk of result.fullStream) {
    if (chunk.type === "tool-call") {
      const args = ("args" in chunk ? chunk.args : "input" in chunk ? chunk.input : {}) as Record<string, unknown>;
      yield {
        type: "tool_call",
        data: {
          toolName: chunk.toolName,
          toolCallId: chunk.toolCallId,
          args
        }
      };
    } else if (chunk.type === "tool-result") {
      const resultObj = "result" in chunk ? chunk.result : "output" in chunk ? chunk.output : chunk;
      yield {
        type: "tool_result",
        data: {
          toolName: chunk.toolName,
          toolCallId: chunk.toolCallId,
          summary: summarizeToolResult(resultObj),
          resourceRefs: extractResourceRefs(resultObj),
        }
      };
    } else if (chunk.type === "text-delta") {
      yield { type: "course_chunk", data: { content: chunk.text, type: "content" } };
    }
  }
}

// ── Discover Source References (job-based generation) ────────────────────
// Plain async version of streamCourseWithMCPTools — returns refs, no SSE events.

export async function discoverSourceReferences(
  onboardingData: OnboardingData
): Promise<Array<{ title: string; authors: string[]; source: string }>> {
  const mcpTools = await getMCPTools();

  const result = await generateText({
    model: getModel(),
    system: getToolAwareGenerationPrompt(onboardingData),
    prompt: `Use the available tools to discover and parse 3-5 relevant books for a course on "${onboardingData.confirmedSubject || onboardingData.topic}". Stop after collecting references — do not generate course content.`,
    tools: mcpTools,
    stopWhen: stepCountIs(8),
    maxOutputTokens: MCP_DISCOVERY_CONFIG.maxOutputTokens,
    onFinish: async () => {
      await closeMCPClient();
    },
  });

  const refs: Array<{ title: string; authors: string[]; source: string }> = [];

  for (const step of result.steps ?? []) {
    for (const toolResult of step.toolResults ?? []) {
      const extracted = extractResourceRefs(
        "result" in toolResult ? toolResult.result : toolResult
      );
      refs.push(...extracted);
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = ref.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarizeToolResult(result: unknown): string {
  if (Array.isArray(result)) {
    return `Found ${result.length} items`;
  }

  if (typeof result === "object" && result !== null) {
    const obj = result as Record<string, unknown>;
    if ("summary" in obj) return String(obj.summary);
    if ("title" in obj) return `Parsed: ${obj.title}`;
  }
  return "Tool executed successfully";
}

function extractResourceRefs(
  result: unknown
): Array<{ title: string; authors: string[]; source: string }> {
  if (typeof result !== "object" || result === null) return [];

  const refs: Array<{ title: string; authors: string[]; source: string }> = [];

  const normalizeAuthors = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => (typeof item === "string" ? item : typeof item === "object" && item ? String((item as { name?: string }).name ?? "") : ""))
      .map((name) => name.trim())
      .filter(Boolean);
  };

  const pushRef = (candidate: Record<string, unknown>) => {
    const title = String(candidate.title ?? "").trim();
    if (!title) return;
    refs.push({
      title,
      authors: normalizeAuthors(candidate.authors),
      source: String(candidate.source ?? "").trim(),
    });
  };

  if (Array.isArray(result)) {
    for (const item of result) {
      if (typeof item === "object" && item) {
        pushRef(item as Record<string, unknown>);
      }
    }
  } else {
    const obj = result as Record<string, unknown>;
    if (Array.isArray(obj.books)) {
      for (const raw of obj.books) {
        if (typeof raw === "object" && raw) {
          pushRef(raw as Record<string, unknown>);
        }
      }
    } else {
      pushRef(obj);
    }
  }

  return refs;
}

// ── Generate Subject Name ─────────────────────────────────────────────────

export async function generateSubjectName(
  onboardingData: Partial<OnboardingData>
): Promise<string> {
  const { topic, level, goal } = onboardingData;

  const prompt = `Generate a clear, specific course subject name based on these parameters:
- Topic: ${topic}
- Level: ${level}
- Goal: ${goal}

The subject name should be:
1. Concise (3-7 words)
2. Descriptive of the course content
3. Include the level if relevant (e.g., "Introduction to...", "Advanced...", "Mastering...")
4. Professional and appealing

Respond with ONLY the subject name, nothing else.

Examples:
- "Classical Guitar for Absolute Beginners"
- "The History of the Roman Empire"
- "Home Cooking: From Basics to Bold Flavours"
- "Mastering Personal Finance"`;

  const result = await generateText({
    model: getModel(),
    prompt,
    maxOutputTokens: 64,
    temperature: GENERATION_CONFIG.temperature,
  });

  return result.text.trim().replace(/^["']|["']$/g, "");
}

