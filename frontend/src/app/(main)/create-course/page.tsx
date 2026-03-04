"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
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
    const [showHistorySidebar, setShowHistorySidebar] = useState(true);

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
        <div className="relative flex h-[calc(100dvh-4rem)] overflow-hidden bg-background lg:h-dvh">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(212,175,55,0.16),transparent_30%),radial-gradient(circle_at_85%_82%,rgba(212,175,55,0.12),transparent_32%)]" />

            {showMobileHistory && (
                <ConversationHistory
                    activeId={activeConvId}
                    onSelect={handleSelectConversation}
                    onNew={handleNewChat}
                    isMobile={true}
                    onClose={() => setShowMobileHistory(false)}
                />
            )}

            {/* Single mobile toolbar — replaces the one previously inside ChatMessage */}
            <div className="absolute inset-x-0 top-0 z-10 flex h-10 items-center justify-between border-b border-border/40 bg-background/70 px-4 backdrop-blur-md lg:hidden">
                <button
                    onClick={() => setShowMobileHistory(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    <History className="h-3.5 w-3.5" />
                    History
                </button>
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground/50">AI Chat</span>
            </div>

            <div className="relative z-10 flex flex-1 min-w-0 pt-10 lg:pt-0">
                <ChatMessage
                    key={chatKey}
                    initialConversationId={activeConvId}
                />
            </div>

            {showHistorySidebar ? (
                <ConversationHistory
                    activeId={activeConvId}
                    onSelect={handleSelectConversation}
                    onNew={handleNewChat}
                    onCollapse={() => setShowHistorySidebar(false)}
                />
            ) : (
                <button
                    className="hidden lg:flex w-5 shrink-0 flex-col items-center justify-center border-l border-border/20 bg-muted/10 transition-colors hover:bg-muted/30"
                    onClick={() => setShowHistorySidebar(true)}
                    title="Show history"
                >
                    <History className="h-3.5 w-3.5 text-muted-foreground/40" />
                </button>
            )}
        </div>
    );
}
