import { generateText, streamText, stepCountIs } from "ai";
import type { ModelMessage } from "ai";
import { getModel, GENERATION_CONFIG, STREAMING_CONFIG } from "../../config/ai";
import {
  getOnboardingSystemPrompt,
  getBookFilteringPrompt,
  getCourseGenerationPrompt,
  getDataExtractionPrompt,
  getToolAwareGenerationPrompt,
} from "./prompts";
import type {
  OnboardingData,
  OnboardingPhase,
  BookContext,
  DiscoveredBook,
  SSEEvent,
} from "../../types";
import { getMCPTools, closeMCPClient } from "../mcp/mcpClient";

// ── Chat (Non-streaming for onboarding) ───────────────────────────────────

export async function chat(
  messages: ModelMessage[],
  currentPhase: OnboardingPhase,
  collectedData: Partial<OnboardingData>
): Promise<string> {
  const systemPrompt = getOnboardingSystemPrompt(currentPhase, collectedData);

  const result = await generateText({
    model: getModel(),
    system: systemPrompt,
    messages,
    maxOutputTokens: GENERATION_CONFIG.maxOutputTokens,
    temperature: GENERATION_CONFIG.temperature,
  });

  return result.text;
}

// ── Extract Data from User Message ────────────────────────────────────────

export async function extractData(
  userMessage: string,
  currentPhase: OnboardingPhase,
  existingData: Partial<OnboardingData>
): Promise<Partial<OnboardingData & { confirmed?: boolean; feedback?: string }>> {
  const prompt = getDataExtractionPrompt(userMessage, currentPhase, existingData);

  const result = await generateText({
    model: getModel(),
    prompt,
    maxOutputTokens: 256,
    temperature: GENERATION_CONFIG.temperature,
  });

  try {
    // Extract JSON from the response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {};
  } catch {
    console.error("Failed to parse extraction result:", result.text);
    return {};
  }
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
      // Close MCP client when done (optional for long-running)
      // await closeMCPClient();
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
          summary: summarizeToolResult(resultObj)
        }
      };
    } else if (chunk.type === "text-delta") {
      yield { type: "course_chunk", data: { content: chunk.text, type: "content" } };
    }
  }
}

function summarizeToolResult(result: unknown): string {
  if (typeof result === "object" && result !== null) {
    const obj = result as Record<string, unknown>;
    if (Array.isArray(obj)) {
      return `Found ${obj.length} items`;
    }
    if ("summary" in obj) return String(obj.summary);
    if ("title" in obj) return `Parsed: ${obj.title}`;
  }
  return "Tool executed successfully";
}

export async function* streamCourse(
  onboardingData: OnboardingData,
  bookContexts: BookContext[]
): AsyncGenerator<string> {
  const prompt = getCourseGenerationPrompt(onboardingData, bookContexts);

  const result = streamText({
    model: getModel(),
    prompt,
    maxOutputTokens: STREAMING_CONFIG.maxOutputTokens,
    temperature: STREAMING_CONFIG.temperature,
  });

  for await (const chunk of result.textStream) {
    yield chunk;
  }
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
- "Introduction to Python Programming"
- "Advanced Machine Learning Techniques"
- "Web Development with React for Beginners"
- "Data Analysis with Python"`;

  const result = await generateText({
    model: getModel(),
    prompt,
    maxOutputTokens: 64,
    temperature: GENERATION_CONFIG.temperature,
  });

  return result.text.trim().replace(/^["']|["']$/g, "");
}
