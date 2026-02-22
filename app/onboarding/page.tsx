import { ChatMessage } from "@/components/onboarding/ChatMessage";

export default function OnboardingPage() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <ChatMessage />
        </div>
    );
}
