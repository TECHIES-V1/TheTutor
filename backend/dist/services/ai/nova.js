"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = chat;
exports.extractData = extractData;
exports.filterBooks = filterBooks;
exports.streamCourseWithMCPTools = streamCourseWithMCPTools;
exports.streamCourse = streamCourse;
exports.generateSubjectName = generateSubjectName;
const ai_1 = require("ai");
const ai_2 = require("../../config/ai");
const prompts_1 = require("./prompts");
const mcpClient_1 = require("../mcp/mcpClient");
// ── Chat (Non-streaming for onboarding) ───────────────────────────────────
async function chat(messages, currentPhase, collectedData) {
    const systemPrompt = (0, prompts_1.getOnboardingSystemPrompt)(currentPhase, collectedData);
    const result = await (0, ai_1.generateText)({
        model: (0, ai_2.getModel)(),
        system: systemPrompt,
        messages,
        maxOutputTokens: ai_2.GENERATION_CONFIG.maxOutputTokens,
        temperature: ai_2.GENERATION_CONFIG.temperature,
    });
    return result.text;
}
// ── Extract Data from User Message ────────────────────────────────────────
async function extractData(userMessage, currentPhase, existingData) {
    const prompt = (0, prompts_1.getDataExtractionPrompt)(userMessage, currentPhase, existingData);
    const result = await (0, ai_1.generateText)({
        model: (0, ai_2.getModel)(),
        prompt,
        maxOutputTokens: 256,
        temperature: ai_2.GENERATION_CONFIG.temperature,
    });
    try {
        // Extract JSON from the response
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return {};
    }
    catch {
        console.error("Failed to parse extraction result:", result.text);
        return {};
    }
}
// ── Filter Books ──────────────────────────────────────────────────────────
async function filterBooks(topic, level, books) {
    const prompt = (0, prompts_1.getBookFilteringPrompt)(topic, level, books.map((b) => ({
        title: b.title,
        authors: b.authors,
        description: b.description,
    })));
    const result = await (0, ai_1.generateText)({
        model: (0, ai_2.getModel)(),
        prompt,
        maxOutputTokens: 128,
        temperature: ai_2.GENERATION_CONFIG.temperature,
    });
    try {
        // Extract JSON array from the response
        const jsonMatch = result.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const indices = JSON.parse(jsonMatch[0]);
            // Convert 1-based to 0-based indices
            return indices.map((i) => i - 1).filter((i) => i >= 0 && i < books.length);
        }
        return [];
    }
    catch {
        console.error("Failed to parse book filter result:", result.text);
        return [];
    }
}
// ── Stream Course Generation ──────────────────────────────────────────────
async function* streamCourseWithMCPTools(onboardingData, courseId, userId) {
    // Get tools directly from MCP server
    const mcpTools = await (0, mcpClient_1.getMCPTools)();
    const result = (0, ai_1.streamText)({
        model: (0, ai_2.getModel)(),
        system: (0, prompts_1.getToolAwareGenerationPrompt)(onboardingData),
        prompt: `Create a comprehensive course on "${onboardingData.confirmedSubject}" for a ${onboardingData.level} learner.`,
        tools: mcpTools, // MCP tools auto-converted to AI SDK tools
        stopWhen: (0, ai_1.stepCountIs)(10), // Max 10 tool call rounds
        maxOutputTokens: ai_2.STREAMING_CONFIG.maxOutputTokens,
        onFinish: async () => {
            // Close MCP client when done (optional for long-running)
            // await closeMCPClient();
        },
    });
    for await (const chunk of result.fullStream) {
        if (chunk.type === "tool-call") {
            const args = ("args" in chunk ? chunk.args : "input" in chunk ? chunk.input : {});
            yield {
                type: "tool_call",
                data: {
                    toolName: chunk.toolName,
                    toolCallId: chunk.toolCallId,
                    args
                }
            };
        }
        else if (chunk.type === "tool-result") {
            const resultObj = "result" in chunk ? chunk.result : "output" in chunk ? chunk.output : chunk;
            yield {
                type: "tool_result",
                data: {
                    toolName: chunk.toolName,
                    toolCallId: chunk.toolCallId,
                    summary: summarizeToolResult(resultObj)
                }
            };
        }
        else if (chunk.type === "text-delta") {
            yield { type: "course_chunk", data: { content: chunk.text, type: "content" } };
        }
    }
}
function summarizeToolResult(result) {
    if (typeof result === "object" && result !== null) {
        const obj = result;
        if (Array.isArray(obj)) {
            return `Found ${obj.length} items`;
        }
        if ("summary" in obj)
            return String(obj.summary);
        if ("title" in obj)
            return `Parsed: ${obj.title}`;
    }
    return "Tool executed successfully";
}
async function* streamCourse(onboardingData, bookContexts) {
    const prompt = (0, prompts_1.getCourseGenerationPrompt)(onboardingData, bookContexts);
    const result = (0, ai_1.streamText)({
        model: (0, ai_2.getModel)(),
        prompt,
        maxOutputTokens: ai_2.STREAMING_CONFIG.maxOutputTokens,
        temperature: ai_2.STREAMING_CONFIG.temperature,
    });
    for await (const chunk of result.textStream) {
        yield chunk;
    }
}
// ── Generate Subject Name ─────────────────────────────────────────────────
async function generateSubjectName(onboardingData) {
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
    const result = await (0, ai_1.generateText)({
        model: (0, ai_2.getModel)(),
        prompt,
        maxOutputTokens: 64,
        temperature: ai_2.GENERATION_CONFIG.temperature,
    });
    return result.text.trim().replace(/^["']|["']$/g, "");
}
