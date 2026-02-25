import { streamText, stepCountIs } from "ai";
import { getMCPTools, closeMCPClient } from "../mcp/mcpClient";
import { getToolAwareGenerationPrompt } from "./prompts";
import { OnboardingData, SSEEvent } from "../../types";

const STREAMING_CONFIG = {
  maxOutputTokens: 4000,
};

function getModel() {
  // Placeholder for your actual model initialization
  // For example: return google('gemini-1.5-pro-latest');
  // You'll need to replace this with your actual model provider
  throw new Error("Model provider not implemented. Import and return your AI SDK model here.");
}

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
    toolChoice: "auto",
    maxOutputTokens: STREAMING_CONFIG.maxOutputTokens,
    onFinish: async () => {
      // Close MCP client when done (optional for long-running)
      // await closeMCPClient();
    },
  });

  for await (const chunk of result.fullStream) {
    if (chunk.type === "tool-call") {
      yield {
        type: "tool_call",
        data: {
          toolName: chunk.toolName,
          toolCallId: chunk.toolCallId,
          args: chunk.args
        }
      };
    } else if (chunk.type === "tool-result") {
      yield {
        type: "tool_result",
        data: {
          toolName: chunk.toolName,
          toolCallId: chunk.toolCallId,
          summary: summarizeToolResult(chunk.result),
          success: true // Assume success if we have a result, you might want more robust error handling
        }
      };
    } else if (chunk.type === "text-delta") {
      yield { type: "course_chunk", data: { content: chunk.textDelta, type: "content" } };
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
