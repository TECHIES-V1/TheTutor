"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatInputProps } from "@/types";

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Automatically focus the input field when the tutor finishes replying (disabled becomes false)
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [disabled]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    };

    const handleSubmit = (e?: React.SyntheticEvent) => {
        if (e) e.preventDefault();
        if (input.trim() && !disabled) {
            onSend(input.trim());
            setInput("");
            if (inputRef.current) {
                inputRef.current.style.height = "auto";
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="sticky bottom-0 z-20 mt-auto w-full bg-gradient-to-t from-background via-background/95 to-transparent px-3 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-4 sm:pt-4">
            <form
                onSubmit={handleSubmit}
                className="neo-surface flex w-full items-end gap-2 rounded-2xl p-1.5 transition-all focus-within:border-primary/35"
            >
                <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onTouchStart={() => inputRef.current?.focus()}
                    placeholder="Message The Tutor..."
                    className="flex-1 min-h-[40px] max-h-32 px-4 py-2 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground shadow-none md:text-base text-sm resize-none overflow-y-auto leading-relaxed"
                    rows={1}
                    disabled={disabled}
                />
                <Button
                    type="submit"
                    size="icon"
                    className="skeuo-gold h-9 w-9 shrink-0 rounded-xl mr-0.5 mb-0.5 hover:!opacity-100"
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
