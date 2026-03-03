"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";

type ConversationSummary = {
  id: string;
  status: "active" | "completed" | "abandoned";
  phase: "onboarding" | "resource_retrieval" | "course_generation" | "completed";
  subject: string | null;
  courseId: string | null;
};

type CompletionNotice = {
  conversationId: string;
  courseId: string;
  subject: string | null;
};

const TRACKED_GENERATIONS_KEY = "thetutor-tracked-generations";

function readTrackedGenerations(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(TRACKED_GENERATIONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((value) => String(value)));
  } catch {
    return new Set();
  }
}

function writeTrackedGenerations(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRACKED_GENERATIONS_KEY, JSON.stringify([...set]));
  } catch {
    // Ignore storage issues.
  }
}

function tryBrowserNotification(notice: CompletionNotice): void {
  if (typeof window === "undefined" || typeof Notification === "undefined") return;

  const title = notice.subject
    ? `Your "${notice.subject}" course is ready`
    : "Your new course is ready";

  const show = () => {
    const notification = new Notification(title, {
      body: "Click to open the course preview.",
      tag: `course-ready-${notice.conversationId}`,
    });
    notification.onclick = () => {
      window.focus();
      window.location.href = `/explore/${notice.courseId}`;
    };
  };

  if (Notification.permission === "granted") {
    show();
    return;
  }

  if (Notification.permission === "default") {
    void Notification.requestPermission().then((permission) => {
      if (permission === "granted") show();
    });
  }
}

export function GenerationNotifier() {
  const { user, isLoading } = useAuth();
  const [notice, setNotice] = useState<CompletionNotice | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await api.get("/chat/conversations");
        if (!res.ok || cancelled) return;

        const data = await res.json() as { conversations?: ConversationSummary[] };
        const conversations = Array.isArray(data.conversations) ? data.conversations : [];

        const tracked = readTrackedGenerations();
        for (const conv of conversations) {
          if (conv.status === "active" && conv.phase === "course_generation") {
            tracked.add(conv.id);
          }
        }

        for (const trackedId of [...tracked]) {
          const conv = conversations.find((entry) => entry.id === trackedId);
          if (!conv) continue;

          if (conv.phase === "completed" && conv.courseId) {
            const completion: CompletionNotice = {
              conversationId: conv.id,
              courseId: conv.courseId,
              subject: conv.subject,
            };
            setNotice(completion);
            tryBrowserNotification(completion);
            tracked.delete(trackedId);
            continue;
          }

          if (conv.status === "abandoned") {
            tracked.delete(trackedId);
          }
        }

        writeTrackedGenerations(tracked);
      } catch {
        // Keep polling quietly; this should never block navigation.
      }
    };

    void poll();
    const interval = setInterval(() => {
      void poll();
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoading, user]);

  if (!notice) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[80] w-[min(92vw,24rem)] rounded-2xl border border-primary/35 bg-background/95 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bell className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Course Ready</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {notice.subject
              ? `Your "${notice.subject}" course has finished generating.`
              : "Your course has finished generating."}
          </p>
          <Link
            href={`/explore/${notice.courseId}`}
            onClick={() => setNotice(null)}
            className="mt-3 inline-flex rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
          >
            Open Course
          </Link>
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => setNotice(null)}
          className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
