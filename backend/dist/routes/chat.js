"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = require("mongoose");
const crypto_1 = require("crypto");
const auth_1 = require("../middleware/auth");
const Conversation_1 = require("../models/Conversation");
const nova_1 = require("../services/ai/nova");
const router = (0, express_1.Router)();
const MAX_REPLIES_PER_ROUND = 5;
function toAIMessages(messages) {
    return messages.map((m) => ({
        role: m.role,
        content: m.content,
    }));
}
// ── POST /chat/message ────────────────────────────────────────────────────
router.post("/message", auth_1.requireAuth, async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        const userId = req.jwtUser.userId;
        if (!message?.trim()) {
            res.status(400).json({ error: "Message is required" });
            return;
        }
        // Find or create conversation
        let conversation = conversationId
            ? await Conversation_1.Conversation.findOne({
                _id: conversationId,
                userId: new mongoose_1.Types.ObjectId(userId),
                status: "active",
            })
            : await Conversation_1.Conversation.findOne({
                userId: new mongoose_1.Types.ObjectId(userId),
                status: "active",
                phase: "onboarding",
            });
        if (!conversation) {
            conversation = new Conversation_1.Conversation({
                userId: new mongoose_1.Types.ObjectId(userId),
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
        const userMessage = {
            id: (0, crypto_1.randomUUID)(),
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
        let aiResponse;
        let suggestedSubject;
        let requiresConfirmation = false;
        if (assistantCountInRound >= MAX_REPLIES_PER_ROUND - 1) {
            // Round limit reached — generate subject from the full conversation
            [suggestedSubject] = await Promise.all([
                (0, nova_1.generateSubjectFromConversation)(conversation.messages),
            ]);
            const extracted = await (0, nova_1.extractOnboardingDataFromConversation)(conversation.messages);
            conversation.onboardingData = {
                ...conversation.onboardingData,
                ...extracted,
            };
            aiResponse =
                `Based on our conversation, I'd like to create a course called:\n\n` +
                    `**${suggestedSubject}**\n\n` +
                    `Is this what you want to learn?`;
            requiresConfirmation = true;
        }
        else {
            aiResponse = await (0, nova_1.chat)(toAIMessages(conversation.messages), Math.max(0, messagesLeft));
        }
        const assistantMessage = {
            id: (0, crypto_1.randomUUID)(),
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
        res.json({
            conversationId: conversation._id.toString(),
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
    }
    catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Failed to process message", code: "AI_ERROR" });
    }
});
// ── GET /chat/conversations ───────────────────────────────────────────────
router.get("/conversations", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.jwtUser.userId;
        const conversations = await Conversation_1.Conversation.find({ userId: new mongoose_1.Types.ObjectId(userId) })
            .sort({ updatedAt: -1 })
            .limit(50)
            .select("_id status phase onboardingData courseId createdAt updatedAt messages");
        res.json({
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
        });
    }
    catch (error) {
        console.error("List conversations error:", error);
        res.status(500).json({ error: "Failed to list conversations", code: "DB_ERROR" });
    }
});
// ── GET /chat/conversation ────────────────────────────────────────────────
router.get("/conversation", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.jwtUser.userId;
        const conversation = await Conversation_1.Conversation.findOne({
            userId: new mongoose_1.Types.ObjectId(userId),
            status: "active",
        }).sort({ updatedAt: -1 });
        if (!conversation) {
            res.status(404).json({ error: "No active conversation", code: "NO_CONVERSATION" });
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
                confirmationAttempts: conversation.confirmationAttempts,
                status: conversation.status,
                courseId: conversation.courseId?.toString(),
            },
        });
    }
    catch (error) {
        console.error("Get conversation error:", error);
        res.status(500).json({ error: "Failed to get conversation", code: "DB_ERROR" });
    }
});
// ── GET /chat/conversation/:id ────────────────────────────────────────────
router.get("/conversation/:id", auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.jwtUser.userId;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "Invalid conversation ID" });
            return;
        }
        const conversation = await Conversation_1.Conversation.findById(id);
        if (!conversation) {
            res.status(404).json({ error: "Conversation not found", code: "NOT_FOUND" });
            return;
        }
        if (conversation.userId.toString() !== userId) {
            res.status(403).json({ error: "Not authorized", code: "FORBIDDEN" });
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
                confirmationAttempts: conversation.confirmationAttempts,
                status: conversation.status,
                courseId: conversation.courseId?.toString(),
            },
        });
    }
    catch (error) {
        console.error("Get conversation error:", error);
        res.status(500).json({ error: "Failed to get conversation", code: "DB_ERROR" });
    }
});
// ── POST /chat/confirm-subject ────────────────────────────────────────────
router.post("/confirm-subject", auth_1.requireAuth, async (req, res) => {
    try {
        const { conversationId, confirmed } = req.body;
        const userId = req.jwtUser.userId;
        if (!conversationId) {
            res.status(400).json({ error: "conversationId is required" });
            return;
        }
        const conversation = await Conversation_1.Conversation.findOne({
            _id: conversationId,
            userId: new mongoose_1.Types.ObjectId(userId),
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
            const subject = lastConfirmMsg?.metadata?.suggestedSubject ||
                conversation.onboardingData.topic ||
                "New Course";
            conversation.onboardingData.confirmedSubject = subject;
            conversation.markModified("onboardingData");
            conversation.phase = "resource_retrieval";
            console.log("[confirm-subject] Saving phase=resource_retrieval for conversation", conversation._id.toString(), "subject:", subject);
            await conversation.save();
            console.log("[confirm-subject] Saved. Phase is now:", conversation.phase);
            res.json({
                success: true,
                conversationId: conversation._id.toString(),
                phase: "resource_retrieval",
                subject,
                message: "Subject confirmed. Ready for course generation.",
            });
        }
        else {
            // Rejection — increment counter, let user continue chatting
            conversation.confirmationAttempts += 1;
            await conversation.save();
            res.json({
                success: true,
                conversationId: conversation._id.toString(),
                phase: "onboarding",
                message: "No problem! Tell me more about what you're looking for and I'll come up with a better fit.",
            });
        }
    }
    catch (error) {
        console.error("Confirm subject error:", error);
        res.status(500).json({ error: "Failed to confirm subject", code: "DB_ERROR" });
    }
});
// ── POST /chat/restart ────────────────────────────────────────────────────
router.post("/restart", auth_1.requireAuth, async (req, res) => {
    try {
        const { conversationId } = req.body;
        const userId = req.jwtUser.userId;
        if (conversationId) {
            await Conversation_1.Conversation.findOneAndUpdate({ _id: conversationId, userId: new mongoose_1.Types.ObjectId(userId), status: "active" }, { status: "abandoned" });
        }
        else {
            await Conversation_1.Conversation.updateMany({ userId: new mongoose_1.Types.ObjectId(userId), status: "active" }, { status: "abandoned" });
        }
        const newConversation = new Conversation_1.Conversation({
            userId: new mongoose_1.Types.ObjectId(userId),
            messages: [],
            phase: "onboarding",
            onboardingData: {},
            confirmationAttempts: 0,
            status: "active",
        });
        await newConversation.save();
        res.json({
            success: true,
            newConversationId: newConversation._id.toString(),
            message: "Conversation restarted",
        });
    }
    catch (error) {
        console.error("Restart error:", error);
        res.status(500).json({ error: "Failed to restart conversation", code: "DB_ERROR" });
    }
});
exports.default = router;
