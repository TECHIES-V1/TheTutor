"use client";

import { useState } from "react";
import { ChatMessage } from "@/components/onboarding/ChatMessage";
import { ConversationHistory } from "@/components/onboarding/ConversationHistory";

export default function CreateCoursePage() {
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [chatKey, setChatKey] = useState(0);

    const handleNewChat = () => {
        setActiveConvId(null);
        setChatKey((k) => k + 1);
    };

    const handleSelectConversation = (id: string) => {
        if (id === activeConvId) return;
        setActiveConvId(id);
        setChatKey((k) => k + 1);
    };

    return (
        <div className="relative flex h-[calc(100svh-4rem)] min-h-[calc(100svh-4rem)] overflow-hidden bg-background sm:h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-4rem)] lg:h-dvh lg:min-h-dvh">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(212,175,55,0.16),transparent_30%),radial-gradient(circle_at_85%_82%,rgba(212,175,55,0.12),transparent_32%)]" />
            <div className="relative z-10 flex flex-1 min-w-0">
                <ChatMessage key={chatKey} initialConversationId={activeConvId} />
            </div>
            <ConversationHistory
                activeId={activeConvId}
                onSelect={handleSelectConversation}
                onNew={handleNewChat}
            />
        </div>
    );
}
