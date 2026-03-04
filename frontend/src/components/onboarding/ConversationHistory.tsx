"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, X, PanelRightClose } from "lucide-react";

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
  isMobile?: boolean;
  onClose?: () => void;
  onCollapse?: () => void;
}

type TimeGroup = { label: string; items: ConvSummary[] };

function groupByPeriod(convs: ConvSummary[]): TimeGroup[] {
  const now = Date.now();
  const groups: TimeGroup[] = [
    { label: "Today",     items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Earlier",   items: [] },
  ];
  for (const c of convs) {
    const days = Math.floor((now - new Date(c.updatedAt).getTime()) / 86400000);
    if (days === 0)      groups[0].items.push(c);
    else if (days === 1) groups[1].items.push(c);
    else if (days < 7)  groups[2].items.push(c);
    else                 groups[3].items.push(c);
  }
  return groups.filter(g => g.items.length > 0);
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  isMobile,
  onClose,
  onCollapse,
}: {
  conversations: ConvSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  isMobile?: boolean;
  onClose?: () => void;
  onCollapse?: () => void;
}) {
  const handleSelect = (id: string) => {
    onSelect(id);
    if (isMobile && onClose) onClose();
  };

  const handleNew = () => {
    onNew();
    if (isMobile && onClose) onClose();
  };

  const groups = groupByPeriod(conversations);

  return (
    <div className={isMobile ? "flex flex-col h-full" : "flex flex-col w-72 flex-shrink-0 border-l border-primary/10 bg-background/50 backdrop-blur-sm"}>
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-border/40 p-3">
        <span className="flex-1 text-sm font-medium text-muted-foreground">History</span>
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 skeuo-gold rounded-lg px-3 py-1.5 text-xs font-medium text-background"
          title="Start a new chat"
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </button>
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-muted"
            title="Close history"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {!isMobile && onCollapse && (
          <button
            onClick={onCollapse}
            className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            title="Collapse history"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
              <Plus className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground">
              No conversations yet.<br />Start a new chat to begin.
            </p>
          </div>
        )}

        {groups.map(group => (
          <div key={group.label}>
            <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(conv => {
                const isActive = conv.id === activeId;
                const title = conv.subject ?? (conv.messageCount > 0 ? "Untitled chat" : "New conversation");
                const hasCourse = !!conv.courseId;
                const shortId = conv.id.slice(-6);

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelect(conv.id)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? "border border-primary/20 bg-primary/10"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{title}</p>
                      <span className="mt-0.5 shrink-0 text-[10px] text-muted-foreground/60">
                        {relativeDate(conv.updatedAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {hasCourse ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Course Created
                        </span>
                      ) : conv.status === "active" ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          In Progress
                        </span>
                      ) : null}
                      <span className="ml-auto font-mono text-[9px] text-muted-foreground/30">
                        #{shortId}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-border/40 p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export function ConversationHistory({ activeId, onSelect, onNew, isMobile, onClose, onCollapse }: Props) {
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

  if (isMobile) {
    return (
      <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-y-0 left-0 flex flex-col overflow-hidden border-r border-primary/10 bg-background animate-in slide-in-from-left duration-300" style={{ width: "min(18rem, 85vw)" }}>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={onSelect}
            onNew={onNew}
            isMobile={true}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  return (
    <ConversationList
      conversations={conversations}
      activeId={activeId}
      onSelect={onSelect}
      onNew={onNew}
      isMobile={false}
      onCollapse={onCollapse}
    />
  );
}
