"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Plus, Paperclip, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatInputProps } from "@/types";

export function ChatInput({ onSend, disabled, confirmation }: ChatInputProps) {
    const [input, setInput] = useState("");
    const [attachMenuOpen, setAttachMenuOpen] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const attachMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!disabled && inputRef.current) {
            inputRef.current.focus();
        }
    }, [disabled]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
                setAttachMenuOpen(false);
            }
        };
        if (attachMenuOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [attachMenuOpen]);

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
            {confirmation ? (
                <div className="neo-surface flex w-full items-center gap-2 rounded-2xl p-2 ring-1 ring-border/50">
                    {confirmation.type === "final" ? (
                        <>
                            <button
                                onClick={confirmation.onConfirm}
                                className="skeuo-gold flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                            >
                                Go — Create my course
                            </button>
                            <button
                                onClick={confirmation.onRestart}
                                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Start a new chat
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={confirmation.onConfirm}
                                className="skeuo-gold flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                            >
                                Yes, that&apos;s it!
                            </button>
                            <button
                                onClick={confirmation.onReject}
                                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                            >
                                No, let me clarify
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="neo-surface flex w-full items-end gap-1.5 rounded-2xl p-2 ring-1 ring-border/50 transition-all focus-within:ring-primary/30"
                >
                    {/* Attach button */}
                    <div ref={attachMenuRef} className="relative mb-0.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setAttachMenuOpen(v => !v)}
                            disabled={disabled}
                            title="Attach file or image"
                            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                attachMenuOpen
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground/50 hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            <Plus className="h-4 w-4" />
                        </button>

                        {attachMenuOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-44 overflow-hidden rounded-xl border border-border/80 bg-card">
                                <button
                                    type="button"
                                    disabled
                                    className="flex w-full cursor-not-allowed items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground/50"
                                >
                                    <ImageIcon className="h-4 w-4" />
                                    Image
                                    <span className="ml-auto text-[10px] text-muted-foreground/40">Soon</span>
                                </button>
                                <div className="mx-2 h-px bg-border/50" />
                                <button
                                    type="button"
                                    disabled
                                    className="flex w-full cursor-not-allowed items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground/50"
                                >
                                    <Paperclip className="h-4 w-4" />
                                    File
                                    <span className="ml-auto text-[10px] text-muted-foreground/40">Soon</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <Textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onTouchStart={() => inputRef.current?.focus()}
                        placeholder="Message The Tutor..."
                        className="flex-1 min-h-[44px] max-h-32 px-2 py-2.5 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground shadow-none text-[15px] leading-relaxed resize-none overflow-y-auto"
                        rows={1}
                        disabled={disabled}
                    />

                    <Button
                        type="submit"
                        size="icon"
                        className="skeuo-gold mb-0.5 h-9 w-9 shrink-0 rounded-xl hover:!opacity-100"
                        disabled={!input.trim() || disabled}
                    >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Send message</span>
                    </Button>
                </form>
            )}
            <div className="mt-3 text-center">
                <span className="text-[11px] text-muted-foreground">The Tutor can make mistakes. Please verify important information.</span>
            </div>
        </div>
    );
}
