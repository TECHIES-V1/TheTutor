"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { stripMarkdown } from "@/lib/stripMarkdown";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Section {
  index: number;
  text: string;
  heading: string | null;
}

export type ReadAloudStatus = "idle" | "loading" | "playing" | "paused";

export interface UseReadAloudReturn {
  status: ReadAloudStatus;
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  progress: { current: number; total: number; percent: number };
  activeSectionText: string | null;
  sectionAnnouncement: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// Chrome kills utterances after ~15s. Keep sections short.
const MAX_SECTION_LENGTH = 250;

/**
 * Build speakable sections from markdown.
 * Extracts headings before stripping, splits text at paragraph/sentence boundaries.
 */
function buildSections(markdown: string): Section[] {
  const headingTexts: string[] = [];
  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = headingRegex.exec(markdown)) !== null) {
    headingTexts.push(m[1].trim());
  }

  const plainText = stripMarkdown(markdown);
  if (!plainText) return [];

  const paragraphs = plainText.split(/\n\n+/);
  const sections: Section[] = [];
  let nextHeadingIdx = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    let heading: string | null = null;
    if (nextHeadingIdx < headingTexts.length) {
      const expected = headingTexts[nextHeadingIdx];
      if (trimmed.toLowerCase().startsWith(expected.toLowerCase())) {
        heading = expected;
        nextHeadingIdx++;
      }
    }

    if (trimmed.length <= MAX_SECTION_LENGTH) {
      sections.push({ index: sections.length, text: trimmed, heading });
    } else {
      const sentences = trimmed.match(/[^.!?]+[.!?]+\s*/g) || [trimmed];
      let buffer = "";
      let isFirst = true;

      for (const sent of sentences) {
        if (buffer.length + sent.length <= MAX_SECTION_LENGTH) {
          buffer += sent;
        } else {
          if (buffer.trim()) {
            sections.push({
              index: sections.length,
              text: buffer.trim(),
              heading: isFirst ? heading : null,
            });
            isFirst = false;
          }
          buffer = sent;
        }
      }
      if (buffer.trim()) {
        sections.push({
          index: sections.length,
          text: buffer.trim(),
          heading: isFirst ? heading : null,
        });
      }
    }
  }

  return sections;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useReadAloud(contentMarkdown: string): UseReadAloudReturn {
  const [status, setStatus] = useState<ReadAloudStatus>("idle");
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionAnnouncement, setSectionAnnouncement] = useState<string | null>(null);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [voicesReady, setVoicesReady] = useState(() => {
    if (typeof window === "undefined") return false;
    return (window.speechSynthesis?.getVoices().length ?? 0) > 0;
  });

  const stoppedRef = useRef(false);
  const playbackRateRef = useRef(1);
  const pendingPlayRef = useRef(false);

  // Track contentMarkdown + startPlayback in refs so the voices callback can access them
  const contentRef = useRef(contentMarkdown);
  useEffect(() => { contentRef.current = contentMarkdown; }, [contentMarkdown]);
  const startPlaybackRef = useRef<((md: string) => void) | null>(null);

  useEffect(() => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth || voicesReady) return;

    const handleReady = () => {
      setVoicesReady(true);
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false;
        startPlaybackRef.current?.(contentRef.current);
      }
    };

    // Voices may already be loaded (SSR hydration missed them) — check via microtask
    // so setState isn't called synchronously in the effect body.
    if (synth.getVoices().length > 0) {
      queueMicrotask(handleReady);
      return;
    }

    const onVoices = () => handleReady();
    synth.addEventListener("voiceschanged", onVoices);
    return () => synth.removeEventListener("voiceschanged", onVoices);
  }, [voicesReady]);

  // Inject ::highlight CSS (Turbopack can't parse it in globals.css) + cleanup on unmount
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "::highlight(read-aloud){background-color:rgba(212,175,55,.25);color:inherit}";
    document.head.appendChild(style);
    return () => {
      window.speechSynthesis?.cancel();
      style.remove();
    };
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = rate;
    setPlaybackRateState(rate);
  }, []);

  const speakSection = useCallback(
    (section: Section): Promise<void> => {
      return new Promise<void>((resolve) => {
        if (stoppedRef.current) { resolve(); return; }

        const utterance = new SpeechSynthesisUtterance(section.text);
        utterance.rate = playbackRateRef.current;
        utterance.pitch = 1;
        utterance.lang = "en-US";

        // Safety timeout — if onend never fires (Chrome bug), auto-advance.
        const estimatedMs = (section.text.length / 15) * 1000 / playbackRateRef.current;
        const timeout = setTimeout(() => resolve(), estimatedMs + 5000);

        utterance.onend = () => { clearTimeout(timeout); resolve(); };
        utterance.onerror = () => { clearTimeout(timeout); resolve(); };

        window.speechSynthesis.speak(utterance);
      });
    },
    []
  );

  const playAllSections = useCallback(
    async (startIndex: number, sectionList: Section[]) => {
      for (let i = startIndex; i < sectionList.length; i++) {
        if (stoppedRef.current) break;

        setCurrentSectionIndex(i);

        const section = sectionList[i];
        if (section.heading) {
          setSectionAnnouncement(section.heading);
          setTimeout(() => setSectionAnnouncement(null), 3000);
        }

        await speakSection(section);
      }

      if (!stoppedRef.current) {
        setSectionAnnouncement(null);
        setCurrentSectionIndex(0);
        setStatus("idle");
      }
    },
    [speakSection]
  );

  const startPlayback = useCallback(async (markdown: string) => {
    window.speechSynthesis.cancel();
    // Chrome needs a tick after cancel() before speak() will work
    await new Promise((r) => setTimeout(r, 50));
    stoppedRef.current = false;

    const built = buildSections(markdown);
    if (built.length === 0) { setStatus("idle"); return; }

    setSections(built);
    setCurrentSectionIndex(0);
    setStatus("playing");

    playAllSections(0, built).catch((err) => {
      console.error("Read-aloud error:", err);
      setStatus("idle");
    });
  }, [playAllSections]);
  useEffect(() => { startPlaybackRef.current = startPlayback; }, [startPlayback]);

  const play = useCallback(() => {
    if (status === "playing") return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (!voicesReady) {
      pendingPlayRef.current = true;
      setStatus("loading");
      // Fallback: if voiceschanged never fires, try after 3s anyway
      setTimeout(() => {
        if (pendingPlayRef.current) {
          pendingPlayRef.current = false;
          setVoicesReady(true);
          startPlaybackRef.current?.(contentRef.current);
        }
      }, 3000);
      return;
    }

    startPlayback(contentMarkdown);
  }, [status, voicesReady, contentMarkdown, startPlayback]);

  const pause = useCallback(() => {
    window.speechSynthesis?.pause();
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    window.speechSynthesis?.resume();
    setStatus("playing");
  }, [status]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    pendingPlayRef.current = false;
    window.speechSynthesis?.cancel();
    setSectionAnnouncement(null);
    setCurrentSectionIndex(0);
    setStatus("idle");
  }, []);

  useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);

  const total = sections.length || 1;
  const progress = {
    current: currentSectionIndex + 1,
    total: sections.length,
    percent: sections.length > 0 ? Math.round(((currentSectionIndex + 1) / total) * 100) : 0,
  };

  // Derive the currently spoken text from section state
  const activeSectionText =
    (status === "playing" || status === "paused") && sections.length > 0
      ? sections[currentSectionIndex]?.text ?? null
      : null;

  return {
    status,
    play,
    pause,
    resume,
    stop,
    playbackRate,
    setPlaybackRate,
    progress,
    activeSectionText,
    sectionAnnouncement,
  };
}
