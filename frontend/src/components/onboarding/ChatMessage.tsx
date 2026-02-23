"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "./ChatInput";
import { tutorResponses } from "@/utils/dummyTutorResponses";
import { MessageField } from "./MessageField";
import { Message } from "@/types";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

export function ChatMessage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const tutorResponseIndex = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    const responseIndex = tutorResponseIndex.current;
    const isLastResponse = responseIndex === tutorResponses.length - 1;

    setTimeout(async () => {
      const tutorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "tutor",
        content: tutorResponses[responseIndex].message,
      };

      tutorResponseIndex.current = (responseIndex + 1) % tutorResponses.length;
      setMessages((prev) => [...prev, tutorMessage]);
      setIsTyping(false);

      // After the final tutor response, mark course creation complete and go to dashboard
      if (isLastResponse) {
        await api.put("/user/complete-onboarding", {});
        router.push("/dashboard");
      }
    }, 1000);
  };

  return (
    <div className="relative z-10 flex h-full w-full max-w-3xl flex-col mx-auto">
      <div className="px-4 pt-4 md:pt-6">
        <div className="neo-surface flex items-center justify-between rounded-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="skeuo-gold flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold">
              T
            </div>
            <div>
              <p className="font-playfair text-base font-semibold text-primary">TheTutor</p>
              <p className="text-xs text-muted-foreground">
                {user?.name ? `Signed in as ${user.name}` : "Signed in"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={logout}
            className="neo-inset h-9 border-primary/25 text-foreground hover:bg-muted hover:text-primary"
          >
            <LogOut className="mr-2 h-4 w-4 text-primary" />
            Logout
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-4 mt-4 md:mt-6">
        <div className="flex flex-col pb-6 max-w-2xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h1 className="text-3xl md:text-4xl text-foreground font-medium mb-4 tracking-tight">
                {getGreeting()}
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-md">
                Hi! I&apos;m your AI tutor. What would you like to learn today?
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageField
                key={msg.id}
                id={msg.id}
                role={msg.role}
                content={msg.content}
              />
            ))
          )}
          {isTyping && (
            <div className="flex w-full py-5 space-x-4 ml-auto justify-start">
              <div className="p-3 rounded-2xl bg-muted/40 text-muted-foreground flex items-center gap-1.5 h-11">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
