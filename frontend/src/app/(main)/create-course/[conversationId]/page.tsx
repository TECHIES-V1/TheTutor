"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { History, ArrowLeft } from "lucide-react";
import { ChatMessage } from "@/components/onboarding/ChatMessage";
import { ConversationHistory } from "@/components/onboarding/ConversationHistory";

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.conversationId as string;

    const [showMobileHistory, setShowMobileHistory] = useState(false);
    const [showHistorySidebar, setShowHistorySidebar] = useState(true);
    const [toolbarVisible, setToolbarVisible] = useState(true);

    const initialId = conversationId === "new" ? null : conversationId;

    const handleNewChat = () => {
        setShowMobileHistory(false);
        router.push("/create-course/new");
    };

    const handleSelectConversation = (id: string) => {
        if (id === conversationId) return;
        setShowMobileHistory(false);
        router.push(`/create-course/${id}`);
    };

    return (
        <div className="relative flex h-[calc(100dvh-4rem)] overflow-hidden bg-background lg:h-dvh">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(212,175,55,0.16),transparent_30%),radial-gradient(circle_at_85%_82%,rgba(212,175,55,0.12),transparent_32%)]" />

            {showMobileHistory && (
                <ConversationHistory
                    activeId={conversationId === "new" ? null : conversationId}
                    onSelect={handleSelectConversation}
                    onNew={handleNewChat}
                    isMobile={true}
                    onClose={() => setShowMobileHistory(false)}
                />
            )}

            {/* Mobile toolbar */}
            <div className={`absolute inset-x-0 top-0 z-20 flex h-10 items-center justify-between border-b border-border/40 bg-background/70 px-4 backdrop-blur-md transition-transform duration-300 lg:hidden ${toolbarVisible ? "translate-y-0" : "-translate-y-full"}`}>
                <button
                    onClick={() => setShowMobileHistory(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    <History className="h-3.5 w-3.5" />
                    History
                </button>
                <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Dashboard
                </Link>
            </div>

            <div className="relative z-10 flex flex-1 min-w-0 pt-10 lg:pt-0">
                <ChatMessage
                    key={conversationId}
                    initialConversationId={initialId}
                    onScrollDirectionChange={setToolbarVisible}
                />
            </div>

            <div className="hidden lg:flex">
                {showHistorySidebar ? (
                    <ConversationHistory
                        activeId={conversationId === "new" ? null : conversationId}
                        onSelect={handleSelectConversation}
                        onNew={handleNewChat}
                        onCollapse={() => setShowHistorySidebar(false)}
                    />
                ) : (
                    <button
                        className="flex w-5 shrink-0 flex-col items-center justify-center border-l border-border/20 bg-muted/10 transition-colors hover:bg-muted/30"
                        onClick={() => setShowHistorySidebar(true)}
                        title="Show history"
                    >
                        <History className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </button>
                )}
            </div>
        </div>
    );
}
