"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatInputProps } from "@/types";

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Automatically focus the input field when the tutor finishes replying (disabled becomes false)
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [disabled]);

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onSend(input.trim());
            setInput("");
        }
    };

    return (
        <div className="p-4 pb-6 w-full bg-background mt-auto">
            <form
                onSubmit={handleSubmit}
                className="flex items-center w-full gap-2 p-1.5 bg-muted/40 border border-border/40 rounded-2xl transition-all focus-within:border-border focus-within:bg-muted/60 shadow-sm opacity-90 hover:opacity-100"
            >
                <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message The Tutor..."
                    className="flex-1 h-10 px-4 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground shadow-none md:text-base text-sm"
                    disabled={disabled}
                />
                <Button
                    type="submit"
                    size="icon"
                    className="rounded-xl shrink-0 h-9 w-9 bg-primary text-primary-foreground hover:bg-primary/90 transition-all mr-0.5"
                    disabled={!input.trim() || disabled}
                >
                    <ArrowUp className="w-4 h-4" />
                    <span className="sr-only">Send message</span>
                </Button>
            </form>
            <div className="text-center mt-3 hidden md:block">
                <span className="text-xs text-muted-foreground">The Tutor can make mistakes. Please verify important information.</span>
            </div>
        </div>
    );
}
