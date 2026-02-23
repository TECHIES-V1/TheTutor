import { ChatMessage } from "@/components/onboarding/ChatMessage";

export default function CreateCoursePage() {
    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(212,175,55,0.16),transparent_30%),radial-gradient(circle_at_85%_82%,rgba(212,175,55,0.12),transparent_32%)]" />
            <ChatMessage />
        </div>
    );
}
