"use client";

import { FormEvent, useState } from "react";
import { Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

interface AiAssistantButtonProps {
    courseId: string;
    lessonId: string;
}

export function AiAssistantButton({ courseId, lessonId }: AiAssistantButtonProps) {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;

        setLoading(true);
        try {
            const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/assistant`, {
                question,
            });
            if (!response.ok) throw new Error("assistant failed");

            const payload = (await response.json()) as { answer: string };
            setAnswer(payload.answer);
        } catch {
            setAnswer("The assistant is unavailable right now. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-[60]">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full skeuo-gold hover:scale-105 transition-transform"
                    >
                        <Sparkles className="h-6 w-6" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Assistant
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <p className="text-xs text-muted-foreground">
                            Ask about this lesson, quiz readiness, or for a quick summary.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ask something about this lesson..."
                                className="neo-inset min-h-28 w-full rounded-xl border border-border/70 bg-transparent p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                            />
                            <Button
                                type="submit"
                                disabled={loading || !question.trim()}
                                className="skeuo-gold w-full rounded-full"
                            >
                                {loading ? "Thinking..." : "Send Question"}
                            </Button>
                        </form>
                        {answer && (
                            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">
                                        Assistant Response
                                    </p>
                                </div>
                                <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto pr-1">
                                    {answer}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
