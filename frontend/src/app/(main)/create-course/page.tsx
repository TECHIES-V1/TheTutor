"use client";

import { useEffect, useState } from "react";
import { ChatMessage } from "@/components/onboarding/ChatMessage";
import { ConversationHistory } from "@/components/onboarding/ConversationHistory";
import { api } from "@/lib/api";

type ConversationSummary = {
    id: string;
    status: "active" | "completed" | "abandoned";
    phase: "onboarding" | "resource_retrieval" | "course_generation" | "completed";
};

export default function CreateCoursePage() {
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [chatKey, setChatKey] = useState(0);
    const [restoredInProgress, setRestoredInProgress] = useState(false);
    const [showMobileHistory, setShowMobileHistory] = useState(false);

    useEffect(() => {
        if (restoredInProgress) return;

        async function restoreInProgressConversation() {
            try {
                const res = await api.get("/chat/conversations");
                if (!res.ok) return;
                const data = await res.json() as { conversations?: ConversationSummary[] };
                const conversations = Array.isArray(data.conversations) ? data.conversations : [];

                const inProgress = conversations.find(
                    (conv) => conv.status === "active" && conv.phase === "course_generation"
                );
                if (inProgress) {
                    setActiveConvId(inProgress.id);
                    setChatKey((k) => k + 1);
                }
            } finally {
                setRestoredInProgress(true);
            }
        }

        restoreInProgressConversation();
    }, [restoredInProgress]);

    const handleNewChat = () => {
        setActiveConvId(null);
        setChatKey((k) => k + 1);
        setShowMobileHistory(false);
    };

    const handleSelectConversation = (id: string) => {
        if (id === activeConvId) return;
        setActiveConvId(id);
        setChatKey((k) => k + 1);
    };

    return (
        <div className="relative flex h-[calc(100svh-4rem)] min-h-[calc(100svh-4rem)] overflow-hidden bg-background sm:h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-4rem)] lg:h-dvh lg:min-h-dvh">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(212,175,55,0.16),transparent_30%),radial-gradient(circle_at_85%_82%,rgba(212,175,55,0.12),transparent_32%)]" />
            {showMobileHistory && (
                <div
                    className="lg:hidden"
                    onClick={() => setShowMobileHistory(false)}
                >
                    <ConversationHistory
                        activeId={activeConvId}
                        onSelect={handleSelectConversation}
                        onNew={handleNewChat}
                        isMobile={true}
                        onClose={() => setShowMobileHistory(false)}
                    />
                </div>
            )}
            <div className="relative z-10 flex flex-1 min-w-0">
                <ChatMessage
                    key={chatKey}
                    initialConversationId={activeConvId}
                    onShowMobileHistory={() => setShowMobileHistory(true)}
                />
            </div>
            <ConversationHistory
                activeId={activeConvId}
                onSelect={handleSelectConversation}
                onNew={handleNewChat}
            />
        </div>
    );
}
