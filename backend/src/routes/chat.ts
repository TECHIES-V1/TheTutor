import { Router, type Request, type Response } from "express";
import { Types } from "mongoose";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware/auth";
import { Conversation, type IMessage, type IConversation } from "../models/Conversation";
import { Course } from "../models/Course";
import {
  chat,
  generateSubjectFromConversation,
  extractOnboardingDataFromConversation,
} from "../services/ai/nova";
import type { ModelMessage } from "ai";
import { aiLimiter } from "../middleware/rateLimiter";
import {
  cacheActiveConversation,
  cacheConversationById,
  cacheConversationsList,
  getCachedActiveConversation,
  getCachedConversationById,
  getCachedConversationsList,
  invalidateConversationByIdCache,
  invalidateConversationCaches,
  invalidateUserConversationCaches,
} from "../services/cache/chatCache";
import { logger } from "../config/logger";

const router = Router();

const MAX_REPLIES_PER_ROUND = 5;
const MAX_RELATED_COURSES = 5;

type RelatedCoursePreview = {
  id: string;
  title: string;
  description: string;
  level: string;
  authorName: string;
  moduleCount: number;
  lessonCount: number;
};

type ConversationPayload = {
  id: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    metadata?: IMessage["metadata"];
  }>;
  phase: IConversation["phase"];
  onboardingData: IConversation["onboardingData"];
  confirmationAttempts: number;
  status: IConversation["status"];
  courseId?: string;
};

type ConversationResponse = {
  conversation: ConversationPayload;
};

type ConversationsListResponse = {
  conversations: Array<{
    id: string;
    status: IConversation["status"];
    phase: IConversation["phase"];
    subject: string | null;
    messageCount: number;
    courseId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

function toSearchTerms(subject: string): string[] {
  const normalized = subject.trim();
  if (!normalized) return [];

  const terms = normalized
    .split(/\s+/)
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length >= 3);

  const uniqueTerms = Array.from(new Set([normalized, ...terms]));
  return uniqueTerms.slice(0, 6);
}

function countLessons(course: {
  curriculum?: Array<{ lessons?: unknown[] }>;
  modules?: Array<{ lessons?: unknown[] }>;
}): number {
  if (Array.isArray(course.curriculum) && course.curriculum.length > 0) {
    return course.curriculum.reduce((sum, module) => {
      return sum + (Array.isArray(module.lessons) ? module.lessons.length : 0);
    }, 0);
  }

  if (Array.isArray(course.modules)) {
    return course.modules.reduce((sum, module) => {
      return sum + (Array.isArray(module.lessons) ? module.lessons.length : 0);
    }, 0);
  }

  return 0;
}

async function findRelatedPublishedCourses(subject: string): Promise<RelatedCoursePreview[]> {
  const terms = toSearchTerms(subject);
  if (terms.length === 0) return [];

  const searchText = terms.join(" ");

  const related = await Course.find(
    {
      $text: { $search: searchText },
      visibility: "published",
      generationStatus: "ready",
    },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(MAX_RELATED_COURSES)
    .select("title description level ownerName curriculum modules")
    .lean();

  return related.map((course) => ({
    id: String(course._id),
    title: String(course.title ?? "Untitled Course"),
    description: String(course.description ?? ""),
    level: String(course.level ?? ""),
    authorName: String((course as any).ownerName ?? "Unknown Author"),
    moduleCount: Array.isArray(course.curriculum) && course.curriculum.length > 0
      ? course.curriculum.length
      : Array.isArray((course as any).modules)
        ? (course as any).modules.length
        : 0,
    lessonCount: countLessons(course as any),
  }));
}

function toAIMessages(messages: IMessage[]): ModelMessage[] {
  return messages.slice(-20).map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

function toConversationPayload(conversation: IConversation): ConversationPayload {
  return {
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
    confirmationAttempts: conversation.confirmationAttempts,
    status: conversation.status,
    courseId: conversation.courseId?.toString(),
  };
}

// ── POST /chat/message ────────────────────────────────────────────────────

router.post("/message", requireAuth, aiLimiter, async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body as { message?: string; conversationId?: string };
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
      : null;

    if (!conversationId) {
      logger.info("[chat/message] No conversationId provided. Starting a fresh onboarding chat.");
      await Conversation.updateMany(
        {
          userId: new Types.ObjectId(userId),
          status: "active",
          phase: "onboarding",
        },
        { status: "abandoned" }
      );
      conversation = new Conversation({
        userId: new Types.ObjectId(userId),
        messages: [],
        phase: "onboarding",
        onboardingData: {},
        confirmationAttempts: 0,
        status: "active",
      });
    }

    if (!conversation) {
      conversation = new Conversation({
        userId: new Types.ObjectId(userId),
        messages: [],
        phase: "onboarding",
        onboardingData: {},
        confirmationAttempts: 0,
        status: "active",
      });
    }

    if (conversation.phase !== "onboarding") {
      res.status(400).json({
        error: "Conversation is not in onboarding phase",
        code: "INVALID_PHASE",
        phase: conversation.phase,
      });
      return;
    }

    // Add user message
    const userMessage: IMessage = {
      id: randomUUID(),
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };
    conversation.messages.push(userMessage);

    // Count assistant messages since the last confirmation message (current round)
    const allMessages = conversation.messages;
    let lastConfirmIndex = -1;
    for (let i = allMessages.length - 1; i >= 0; i--) {
      if (allMessages[i].role === "assistant" && allMessages[i].metadata?.isConfirmation) {
        lastConfirmIndex = i;
        break;
      }
    }
    const currentRoundMessages = allMessages.slice(lastConfirmIndex + 1);
    const assistantCountInRound = currentRoundMessages.filter((m) => m.role === "assistant").length;
    const messagesLeft = MAX_REPLIES_PER_ROUND - assistantCountInRound - 1;

    let aiResponse: string;
    let suggestedSubject: string | undefined;
    let requiresConfirmation = false;

    if (assistantCountInRound >= MAX_REPLIES_PER_ROUND - 1) {
      // Round limit reached — generate subject from the full conversation
      [suggestedSubject] = await Promise.all([
        generateSubjectFromConversation(conversation.messages),
      ]);
      const extracted = await extractOnboardingDataFromConversation(conversation.messages);
      conversation.onboardingData = {
        ...conversation.onboardingData,
        ...extracted,
      };
      aiResponse =
        `Based on our conversation, I'd like to create a course called:\n\n` +
        `**${suggestedSubject}**\n\n` +
        `Is this what you want to learn?`;
      requiresConfirmation = true;
    } else {
      aiResponse = await chat(toAIMessages(conversation.messages), Math.max(0, messagesLeft));
    }

    const assistantMessage: IMessage = {
      id: randomUUID(),
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
      metadata: {
        isConfirmation: requiresConfirmation,
        ...(suggestedSubject ? { suggestedSubject } : {}),
      },
    };
    conversation.messages.push(assistantMessage);
    await conversation.save();
    const savedConversationId = conversation._id.toString();
    const conversationPayload: ConversationResponse = {
      conversation: toConversationPayload(conversation),
    };

    await Promise.all([
      invalidateConversationCaches(userId, savedConversationId),
      cacheActiveConversation(userId, conversationPayload),
      cacheConversationById(userId, savedConversationId, conversationPayload),
    ]);

    res.json({
      conversationId: savedConversationId,
      message: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        timestamp: assistantMessage.timestamp.toISOString(),
        metadata: assistantMessage.metadata,
      },
      requiresConfirmation,
      isFinalConfirmation: requiresConfirmation && conversation.confirmationAttempts >= 1,
      suggestedSubject,
    });
  } catch (error) {
    logger.error({ err: error }, "Chat error");
    res.status(500).json({ error: "Failed to process message", code: "AI_ERROR" });
  }
});

// ── GET /chat/conversations ───────────────────────────────────────────────

router.get("/conversations", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.jwtUser!.userId;
    const cachedPayload = await getCachedConversationsList<ConversationsListResponse>(userId);
    if (cachedPayload) {
      res.json(cachedPayload);
      return;
    }

    const conversations = await Conversation.find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select("_id status phase onboardingData courseId createdAt updatedAt messages");

    const payload: ConversationsListResponse = {
      conversations: conversations.map((c) => ({
        id: c._id.toString(),
        status: c.status,
        phase: c.phase,
        subject: c.onboardingData?.confirmedSubject ?? null,
        messageCount: c.messages.length,
        courseId: c.courseId?.toString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };

    await cacheConversationsList(userId, payload);
    res.json(payload);
  } catch (error) {
    logger.error({ err: error }, "List conversations error");
    res.status(500).json({ error: "Failed to list conversations", code: "DB_ERROR" });
  }
});

// ── GET /chat/conversation ────────────────────────────────────────────────

router.get("/conversation", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.jwtUser!.userId;
    const cachedPayload = await getCachedActiveConversation<ConversationResponse>(userId);
    if (cachedPayload) {
      res.json(cachedPayload);
      return;
    }

    const conversation = await Conversation.findOne({
      userId: new Types.ObjectId(userId),
      status: "active",
    }).sort({ updatedAt: -1 });

    if (!conversation) {
      res.status(404).json({ error: "No active conversation", code: "NO_CONVERSATION" });
      return;
    }

    const payload: ConversationResponse = { conversation: toConversationPayload(conversation) };
    await Promise.all([
      cacheActiveConversation(userId, payload),
      cacheConversationById(userId, conversation._id.toString(), payload),
    ]);

    res.json(payload);
  } catch (error) {
    logger.error({ err: error }, "Get conversation error");
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

    const cachedPayload = await getCachedConversationById<ConversationResponse>(userId, id);
    if (cachedPayload) {
      res.json(cachedPayload);
      return;
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found", code: "NOT_FOUND" });
      return;
    }

    if (conversation.userId.toString() !== userId) {
      res.status(403).json({ error: "Not authorized", code: "FORBIDDEN" });
      return;
    }

    const payload: ConversationResponse = { conversation: toConversationPayload(conversation) };
    await cacheConversationById(userId, id, payload);
    if (conversation.status === "active") {
      await cacheActiveConversation(userId, payload);
    }

    res.json(payload);
  } catch (error) {
    logger.error({ err: error }, "Get conversation error");
    res.status(500).json({ error: "Failed to get conversation", code: "DB_ERROR" });
  }
});

// ── POST /chat/confirm-subject ────────────────────────────────────────────

router.post("/confirm-subject", requireAuth, async (req: Request, res: Response) => {
  try {
    const { conversationId, confirmed } = req.body as { conversationId?: string; confirmed?: boolean };
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
      res.status(404).json({ error: "Conversation not found", code: "NO_CONVERSATION" });
      return;
    }

    if (confirmed) {
      // Get confirmed subject from the last confirmation message
      const lastConfirmMsg = [...conversation.messages]
        .reverse()
        .find((m) => m.role === "assistant" && m.metadata?.isConfirmation);
      const subject =
        lastConfirmMsg?.metadata?.suggestedSubject ||
        conversation.onboardingData.topic ||
        "New Course";

      conversation.onboardingData.confirmedSubject = subject;
      conversation.markModified("onboardingData");
      conversation.phase = "resource_retrieval";

      logger.info({ conversationId: conversation._id.toString(), subject }, "[confirm-subject] Saving phase=resource_retrieval for conversation");
      const relatedCourses = await findRelatedPublishedCourses(subject);
      const discoveryMessage =
        relatedCourses.length > 0
          ? `Before I build a new course, I found ${relatedCourses.length} similar public course${relatedCourses.length === 1 ? "" : "s"} you can explore first.`
          : "I checked for similar public courses and found nothing close right now. I'll create a new course for you.";

      const discoveryAssistantMessage: IMessage = {
        id: randomUUID(),
        role: "assistant",
        content: discoveryMessage,
        timestamp: new Date(),
        metadata: {
          relatedCourses,
        },
      };
      conversation.messages.push(discoveryAssistantMessage);

      await conversation.save();
      const savedConversationId = conversation._id.toString();
      const payload: ConversationResponse = {
        conversation: toConversationPayload(conversation),
      };
      await Promise.all([
        invalidateConversationCaches(userId, savedConversationId),
        cacheActiveConversation(userId, payload),
        cacheConversationById(userId, savedConversationId, payload),
      ]);
      logger.info({ phase: conversation.phase, relatedCoursesCount: relatedCourses.length }, "[confirm-subject] Saved");

      res.json({
        success: true,
        conversationId: conversation._id.toString(),
        phase: "resource_retrieval",
        subject,
        message: discoveryMessage,
        relatedCourses,
        hasRelatedCourses: relatedCourses.length > 0,
      });
    } else {
      // Rejection — increment counter, let user continue chatting
      conversation.confirmationAttempts += 1;
      await conversation.save();
      const savedConversationId = conversation._id.toString();
      const payload: ConversationResponse = {
        conversation: toConversationPayload(conversation),
      };
      await Promise.all([
        invalidateConversationCaches(userId, savedConversationId),
        cacheActiveConversation(userId, payload),
        cacheConversationById(userId, savedConversationId, payload),
      ]);

      res.json({
        success: true,
        conversationId: conversation._id.toString(),
        phase: "onboarding",
        message: "No problem! Tell me more about what you're looking for and I'll come up with a better fit.",
      });
    }
  } catch (error) {
    logger.error({ err: error }, "Confirm subject error");
    res.status(500).json({ error: "Failed to confirm subject", code: "DB_ERROR" });
  }
});

// ── POST /chat/restart ────────────────────────────────────────────────────

router.post("/restart", requireAuth, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.body as { conversationId?: string };
    const userId = req.jwtUser!.userId;
    const conversationsToInvalidate: string[] = [];

    if (conversationId) {
      conversationsToInvalidate.push(conversationId);
      await Conversation.findOneAndUpdate(
        { _id: conversationId, userId: new Types.ObjectId(userId), status: "active" },
        { status: "abandoned" }
      );
    } else {
      const activeConversations = await Conversation.find({
        userId: new Types.ObjectId(userId),
        status: "active",
      }).select("_id");
      conversationsToInvalidate.push(
        ...activeConversations.map((conversation) => conversation._id.toString())
      );
      await Conversation.updateMany(
        { userId: new Types.ObjectId(userId), status: "active" },
        { status: "abandoned" }
      );
    }

    const newConversation = new Conversation({
      userId: new Types.ObjectId(userId),
      messages: [],
      phase: "onboarding",
      onboardingData: {},
      confirmationAttempts: 0,
      status: "active",
    });
    await newConversation.save();
    const newConversationId = newConversation._id.toString();
    const newPayload: ConversationResponse = {
      conversation: toConversationPayload(newConversation),
    };

    await invalidateUserConversationCaches(userId);
    await Promise.all(
      conversationsToInvalidate.map((idToInvalidate) =>
        invalidateConversationByIdCache(userId, idToInvalidate)
      )
    );
    await Promise.all([
      cacheActiveConversation(userId, newPayload),
      cacheConversationById(userId, newConversationId, newPayload),
    ]);

    res.json({
      success: true,
      newConversationId,
      message: "Conversation restarted",
    });
  } catch (error) {
    logger.error({ err: error }, "Restart error");
    res.status(500).json({ error: "Failed to restart conversation", code: "DB_ERROR" });
  }
});

export default router;
