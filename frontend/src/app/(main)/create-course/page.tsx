import { ChatMessage } from "@/components/onboarding/ChatMessage";

export default function CreateCoursePage() {
    return (
        <div className="relative flex h-[calc(100svh-4rem)] min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-background sm:h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-4rem)] lg:h-dvh lg:min-h-dvh">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(212,175,55,0.16),transparent_30%),radial-gradient(circle_at_85%_82%,rgba(212,175,55,0.12),transparent_32%)]" />
            <ChatMessage />
        </div>
    );
}
