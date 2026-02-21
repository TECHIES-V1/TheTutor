"use client";

import { useState, useEffect, useRef } from "react";
import { ChatInput } from "./ChatInput";
import { tutorResponses } from "@/utils/dummyTutorResponses";
import { MessageField } from "./MessageField";
import { Message } from "@/types";

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

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = (content: string) => {
        // Add User Message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content,
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsTyping(true);

        // Simulate Tutor Response Delay
        setTimeout(() => {
            const tutorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "tutor",
                content: tutorResponses[tutorResponseIndex.current].message,
            };

            // Cycle through responses
            tutorResponseIndex.current =
                (tutorResponseIndex.current + 1) % tutorResponses.length;

            setMessages((prev) => [...prev, tutorMessage]);
            setIsTyping(false);
        }, 1000); // 1-second delay feels natural enough
    };

    return (
        <div className="flex flex-col w-full h-full max-w-3xl mx-auto bg-background/50">
            <div ref={scrollRef} className="flex-1 px-4 mt-8 md:mt-12 overflow-y-auto no-scrollbar">
                <div className="flex flex-col pb-6 max-w-2xl mx-auto w-full">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-10 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <h1 className="text-3xl md:text-4xl text-foreground font-medium mb-4 tracking-tight">
                                {getGreeting()}
                            </h1>
                            <p className="text-muted-foreground text-lg md:text-xl max-w-md">
                                Hi! I&apos;m your AI tutor. How can I help you today?
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
