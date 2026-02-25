import { Router, type Request, type Response } from "express";
import { Types } from "mongoose";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware/auth";
import { Conversation, type IMessage } from "../models/Conversation";
import { chat, extractData, generateSubjectName } from "../services/ai/nova";
import type {
  OnboardingPhase,
  ConversationPhase,
  OnboardingData,
  SendMessageRequest,
  ConfirmSubjectRequest,
} from "../types";
import type { ModelMessage } from "ai";

const router = Router();

// ── Determine Onboarding Phase ────────────────────────────────────────────

function determineOnboardingPhase(data: Partial<OnboardingData>): OnboardingPhase {
  if (!data.topic) return "topic";
  if (!data.level) return "level";
  if (!data.hoursPerWeek) return "time";
  if (!data.goal) return "goal";
  return "confirmation";
}

function getOnboardingProgress(phase: OnboardingPhase): number {
  const progressMap: Record<OnboardingPhase, number> = {
    topic: 1,
    level: 2,
    time: 3,
    goal: 4,
    confirmation: 5,
  };
  return progressMap[phase];
}

// ── Convert Messages to AI Format ─────────────────────────────────────────

function toAIMessages(messages: IMessage[]): ModelMessage[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

// ── POST /chat/message ────────────────────────────────────────────────────

router.post("/message", requireAuth, async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body as SendMessageRequest;
    const userId = req.jwtUser!.userId;

    if (!message?.trim()) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // Find or create conversation
    let conversation = conversationId
      ? await Conversation.findOne({
        _id: conversationId,
        userId: new Types.ObjectId(userId),
        status: "active",
      })
      : await Conversation.findOne({
        userId: new Types.ObjectId(userId),
        status: "active",
        phase: "onboarding",
      });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        userId: new Types.ObjectId(userId),
        messages: [],
        phase: "onboarding" as ConversationPhase,
        onboardingData: {},
        status: "active",
      });
    }

    // Check if conversation is in onboarding phase
    if (conversation.phase !== "onboarding") {
      res.status(400).json({
        error: "Conversation is not in onboarding phase",
        code: "INVALID_PHASE",
        phase: conversation.phase,
      });
      return;
    }

    // Determine current onboarding phase
    const currentPhase = determineOnboardingPhase(conversation.onboardingData);

    // Add user message
    const userMessage: IMessage = {
      id: randomUUID(),
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);

    // Extract data from user message
    const extractedData = await extractData(
      message,
      currentPhase,
      conversation.onboardingData
    );

    // Update onboarding data
    if (extractedData.topic) {
      conversation.onboardingData.topic = extractedData.topic;
    }
    if (extractedData.level) {
      conversation.onboardingData.level = extractedData.level;
    }
    if (extractedData.hoursPerWeek) {
      conversation.onboardingData.hoursPerWeek = extractedData.hoursPerWeek;
    }
    if (extractedData.goal) {
      conversation.onboardingData.goal = extractedData.goal;
    }

    // Determine next phase after extraction
    const nextPhase = determineOnboardingPhase(conversation.onboardingData);

    // Generate AI response
    const aiMessages = toAIMessages(conversation.messages);
    let aiResponse = await chat(aiMessages, nextPhase, conversation.onboardingData);

    // If we're in confirmation phase, generate a subject name if needed
    let suggestedSubject: string | undefined;
    if (nextPhase === "confirmation" && !conversation.onboardingData.confirmedSubject) {
      suggestedSubject = await generateSubjectName(conversation.onboardingData);
      // Include the subject in the response if not already mentioned
      if (!aiResponse.includes(suggestedSubject)) {
        aiResponse += `\n\nI'd like to create a course called: **${suggestedSubject}**\n\nDoes this sound right for what you're looking for?`;
      }
    }

    // Create assistant message
    const assistantMessage: IMessage = {
      id: randomUUID(),
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
      metadata: {
        phase: nextPhase,
        extractedData: {
          ...extractedData,
          ...(suggestedSubject ? { suggestedSubject } : {}),
        },
      },
    };
    conversation.messages.push(assistantMessage);

    await conversation.save();

    // Build response
    res.json({
      conversationId: conversation._id.toString(),
      message: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        timestamp: assistantMessage.timestamp.toISOString(),
        metadata: assistantMessage.metadata,
      },
      phase: conversation.phase,
      onboardingProgress: getOnboardingProgress(nextPhase),
      requiresConfirmation: nextPhase === "confirmation",
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Failed to process message",
      code: "AI_ERROR",
    });
  }
});

// ── GET /chat/conversation ────────────────────────────────────────────────

router.get("/conversation", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.jwtUser!.userId;

    const conversation = await Conversation.findOne({
      userId: new Types.ObjectId(userId),
      status: "active",
    }).sort({ updatedAt: -1 });

    if (!conversation) {
      res.status(404).json({
        error: "No active conversation",
        code: "NO_CONVERSATION",
      });
      return;
    }

    res.json({
      conversation: {
        id: conversation._id.toString(),
        messages: conversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
          metadata: m.metadata,
        })),
        phase: conversation.phase,
        onboardingData: conversation.onboardingData,
        status: conversation.status,
        courseId: conversation.courseId?.toString(),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ error: "Failed to get conversation", code: "DB_ERROR" });
  }
});

// ── GET /chat/conversation/:id ────────────────────────────────────────────

router.get("/conversation/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.jwtUser!.userId;
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid conversation ID" });
      return;
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      res.status(404).json({
        error: "Conversation not found",
        code: "NOT_FOUND",
      });
      return;
    }

    if (conversation.userId.toString() !== userId) {
      res.status(403).json({
        error: "Not authorized to access this conversation",
        code: "FORBIDDEN",
      });
      return;
    }

    res.json({
      conversation: {
        id: conversation._id.toString(),
        messages: conversation.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
          metadata: m.metadata,
        })),
        phase: conversation.phase,
        onboardingData: conversation.onboardingData,
        status: conversation.status,
        courseId: conversation.courseId?.toString(),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ error: "Failed to get conversation", code: "DB_ERROR" });
  }
});

// ── POST /chat/confirm-subject ────────────────────────────────────────────

router.post("/confirm-subject", requireAuth, async (req: Request, res: Response) => {
  try {
    const { conversationId, confirmed } = req.body as ConfirmSubjectRequest;
    const userId = req.jwtUser!.userId;

    if (!conversationId) {
      res.status(400).json({ error: "conversationId is required" });
      return;
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: new Types.ObjectId(userId),
      status: "active",
    });

    if (!conversation) {
      res.status(404).json({
        error: "Conversation not found",
        code: "NO_CONVERSATION",
      });
      return;
    }

    if (confirmed) {
      // Get the suggested subject from the last assistant message
      const lastAssistantMessage = [...conversation.messages]
        .reverse()
        .find((m) => m.role === "assistant");
      const suggestedSubject =
        lastAssistantMessage?.metadata?.extractedData?.suggestedSubject ||
        conversation.onboardingData.topic ||
        "New Course";

      // Confirm the subject and move to resource retrieval
      conversation.onboardingData.confirmedSubject = suggestedSubject;
      conversation.phase = "resource_retrieval";
      await conversation.save();

      res.json({
        success: true,
        conversationId: conversation._id.toString(),
        phase: "resource_retrieval",
        subject: suggestedSubject,
        message: "Subject confirmed. Ready for course generation.",
      });
    } else {
      // Reject - tell the AI the user wants changes and ask what else is needed.
      // Do NOT abandon the conversation or erase the onboarding data.

      const userMessage: IMessage = {
        id: randomUUID(),
        role: "user",
        content: "I do not want this subject. I want to adjust my learning goals. What else do you need to know to find the right course subject for me?",
        timestamp: new Date(),
      };
      conversation.messages.push(userMessage);

      // We maintain the phase as "confirmation" for the Chat logic (or reset to topic/goal if we wanted, 
      // but feeding it into the AI as confirmation allows it to gracefully ask what is wrong).
      // For best flexibility, we can let our `chat` AI function respond directly to the rejection.

      const aiMessages = toAIMessages(conversation.messages);
      const aiResponse = await chat(aiMessages, "confirmation", conversation.onboardingData);

      const assistantMessage: IMessage = {
        id: randomUUID(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
        metadata: {
          phase: "confirmation",
          extractedData: conversation.onboardingData,
        },
      };
      conversation.messages.push(assistantMessage);

      await conversation.save();

      res.json({
        success: true,
        conversationId: conversation._id.toString(),
        phase: "onboarding", // keep the frontend in the onboarding chat view
        message: assistantMessage.content,
      });
    }
  } catch (error) {
    console.error("Confirm subject error:", error);
    res.status(500).json({ error: "Failed to confirm subject", code: "DB_ERROR" });
  }
});

// ── POST /chat/restart ────────────────────────────────────────────────────

router.post("/restart", requireAuth, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.body as { conversationId?: string };
    const userId = req.jwtUser!.userId;

    // Abandon specified or current conversation
    if (conversationId) {
      await Conversation.findOneAndUpdate(
        {
          _id: conversationId,
          userId: new Types.ObjectId(userId),
          status: "active",
        },
        { status: "abandoned" }
      );
    } else {
      await Conversation.updateMany(
        {
          userId: new Types.ObjectId(userId),
          status: "active",
        },
        { status: "abandoned" }
      );
    }

    // Create new conversation
    const newConversation = new Conversation({
      userId: new Types.ObjectId(userId),
      messages: [],
      phase: "onboarding" as ConversationPhase,
      onboardingData: {},
      status: "active",
    });
    await newConversation.save();

    res.json({
      success: true,
      newConversationId: newConversation._id.toString(),
      message: "Conversation restarted",
    });
  } catch (error) {
    console.error("Restart error:", error);
    res.status(500).json({ error: "Failed to restart conversation", code: "DB_ERROR" });
  }
});

export default router;
