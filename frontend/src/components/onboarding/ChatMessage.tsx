"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "./ChatInput";
import { tutorResponses } from "@/utils/dummyTutorResponses";
import { MessageField } from "./MessageField";
import { Message } from "@/types";
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
    <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
      <div ref={scrollRef} className="mt-4 flex-1 min-h-0 overflow-y-auto px-4 no-scrollbar md:mt-6">
        <div className="flex flex-col pb-6 max-w-2xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center pt-10 md:pt-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h1 className="text-2xl md:text-4xl text-foreground font-medium mb-4 tracking-tight">
                {getGreeting()}
              </h1>
              <p className="text-muted-foreground text-sm md:text-xl max-w-md">
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
