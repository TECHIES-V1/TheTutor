"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  BookOpen,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  X,
  PanelRightClose,
} from "lucide-react";

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
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Earlier", items: [] },
  ];
  for (const c of convs) {
    const days = Math.floor(
      (now - new Date(c.updatedAt).getTime()) / 86400000
    );
    if (days === 0) groups[0].items.push(c);
    else if (days === 1) groups[1].items.push(c);
    else if (days < 7) groups[2].items.push(c);
    else groups[3].items.push(c);
  }
  return groups.filter((g) => g.items.length > 0);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function SkeletonList() {
  return (
    <div className="space-y-2 px-2 py-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-xl px-3 py-3"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-3.5 w-3/4 animate-pulse rounded-md bg-muted/60" />
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-16 animate-pulse rounded-md bg-muted/40" />
            <div className="h-2.5 w-8 animate-pulse rounded-md bg-muted/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  loading,
  isMobile,
  onClose,
  onCollapse,
}: {
  conversations: ConvSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  loading: boolean;
  isMobile?: boolean;
  onClose?: () => void;
  onCollapse?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSelect = (id: string) => {
    onSelect(id);
    if (isMobile && onClose) onClose();
  };

  const handleNew = () => {
    onNew();
    if (isMobile && onClose) onClose();
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter(
      (c) =>
        c.subject?.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  const groups = groupByPeriod(filtered);
  const totalCount = conversations.length;

  return (
    <div
      className={
        isMobile
          ? "flex flex-col h-full"
          : "neo-surface flex flex-col w-72 flex-shrink-0 border-l border-[var(--glass-border)]"
      }
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/40 px-3 pt-3 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80">
              History
            </span>
            {totalCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/12 px-1 text-[9px] font-bold text-primary">
                {totalCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={`rounded-lg p-1.5 transition-colors ${
              searchOpen
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/50 hover:bg-muted hover:text-foreground"
            }`}
            title="Search conversations"
          >
            <Search className="h-3.5 w-3.5" />
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
              className="rounded-lg p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
              title="Collapse history"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Search input */}
        {searchOpen && (
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats..."
              autoFocus
              className="w-full rounded-lg border border-border/60 bg-background-soft py-1.5 pl-7 pr-7 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/40 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* New Chat button */}
        <button
          onClick={handleNew}
          className="mt-2 flex w-full items-center justify-center gap-1.5 skeuo-gold rounded-xl px-3 py-2 text-xs font-semibold"
          title="Start a new chat"
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <SkeletonList />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-primary/8">
              <Sparkles className="h-6 w-6 text-primary/60" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground/70">
                No conversations yet
              </p>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Start a new chat to create<br />your first AI-powered course.
              </p>
            </div>
          </div>
        ) : filtered.length === 0 && query ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
            <Search className="h-5 w-5 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/60">
              No chats matching &ldquo;{query}&rdquo;
            </p>
          </div>
        ) : (
          <div className="px-1.5 py-2">
            {groups.map((group) => (
              <div key={group.label} className="mb-1">
                <p className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((conv) => {
                    const isActive = conv.id === activeId;
                    const title =
                      conv.subject ??
                      (conv.messageCount > 0
                        ? "Untitled chat"
                        : "New conversation");
                    const hasCourse = !!conv.courseId;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelect(conv.id)}
                        className={`group relative w-full rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
                          isActive
                            ? "bg-primary/10"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                        )}

                        <div className="flex items-start gap-2.5">
                          {/* Icon */}
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg ${
                              hasCourse
                                ? "bg-primary/15 text-primary"
                                : "bg-muted/60 text-muted-foreground/50"
                            }`}
                          >
                            {hasCourse ? (
                              <BookOpen className="h-2.5 w-2.5" />
                            ) : (
                              <MessageSquare className="h-2.5 w-2.5" />
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-[13px] leading-tight ${
                                isActive
                                  ? "font-semibold text-foreground"
                                  : "font-medium text-foreground/85 group-hover:text-foreground"
                              }`}
                            >
                              {title}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              {hasCourse ? (
                                <span className="rounded-md bg-primary/12 px-1.5 py-px text-[9px] font-semibold text-primary">
                                  Course
                                </span>
                              ) : conv.status === "active" ? (
                                <span className="rounded-md bg-muted/80 px-1.5 py-px text-[9px] font-medium text-muted-foreground/70">
                                  Draft
                                </span>
                              ) : null}
                              {conv.messageCount > 0 && (
                                <span className="text-[9px] text-muted-foreground/40">
                                  {conv.messageCount} msg{conv.messageCount !== 1 ? "s" : ""}
                                </span>
                              )}
                              <span className="ml-auto shrink-0 text-[9px] text-muted-foreground/35">
                                {relativeTime(conv.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-border/40 px-3 py-2.5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export function ConversationHistory({
  activeId,
  onSelect,
  onNew,
  isMobile,
  onClose,
  onCollapse,
}: Props) {
  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/chat/conversations")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setConversations(data.conversations);
      })
      .catch((err) => console.error("[TheTutor] Failed to delete conversation:", err))
      .finally(() => setLoading(false));
  }, []);

  if (isMobile) {
    return (
      <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
        <div
          className="absolute inset-y-0 left-0 flex flex-col overflow-hidden border-r border-[var(--glass-border)] bg-background animate-in slide-in-from-left duration-300"
          style={{ width: "min(18rem, 85vw)" }}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={onSelect}
            onNew={onNew}
            loading={loading}
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
      loading={loading}
      isMobile={false}
      onCollapse={onCollapse}
    />
  );
}
