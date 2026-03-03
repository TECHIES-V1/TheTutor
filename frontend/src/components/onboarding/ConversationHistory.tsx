"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Plus } from "lucide-react";

interface ConvSummary {
  id: string;
  status: "active" | "completed" | "abandoned";
  subject: string | null;
  messageCount: number;
  courseId: string | null;
  updatedAt: string;
}

interface Props {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

export function ConversationHistory({ activeId, onSelect, onNew }: Props) {
  const [conversations, setConversations] = useState<ConvSummary[]>([]);

  useEffect(() => {
    api
      .get("/chat/conversations")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setConversations(data.conversations);
      })
      .catch(() => {});
  }, [activeId]);

  return (
    <aside className="hidden lg:flex flex-col w-72 border-l border-border bg-background/60 backdrop-blur-sm flex-shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <span className="flex-1 text-sm font-medium text-muted-foreground">History</span>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 skeuo-gold px-3 py-1.5 rounded-lg text-xs font-medium text-background"
        >
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-1">
        {conversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-8 px-4">
            No past conversations yet.
          </p>
        )}
        {conversations.map((conv) => {
          const isActive = conv.id === activeId;
          const title =
            conv.subject ??
            (conv.messageCount > 0 ? "Untitled chat" : "New conversation");
          const hasCourse = !!conv.courseId;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/40 border-b border-border/40 ${
                isActive ? "bg-muted/60 border-l-2 border-l-primary" : ""
              }`}
            >
              <p className="text-sm font-medium text-foreground truncate">{title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    hasCourse
                      ? "bg-primary"
                      : conv.status === "active"
                      ? "bg-muted-foreground"
                      : "bg-muted-foreground/40"
                  }`}
                />
                <span className="text-xs text-muted-foreground truncate">
                  {relativeDate(conv.updatedAt)}
                  {hasCourse
                    ? " · Course created"
                    : conv.status === "abandoned"
                    ? " · Abandoned"
                    : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
