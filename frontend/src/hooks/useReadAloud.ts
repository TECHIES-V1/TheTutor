"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { stripMarkdown } from "@/lib/stripMarkdown";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Section {
  index: number;
  text: string;
  heading: string | null;
  wordOffset: number;
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
  highlightWordIndex: number | null;
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
  // Extract headings in order from original markdown
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
  let wordOffset = 0;
  let nextHeadingIdx = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Check if this paragraph starts with the next heading text
    let heading: string | null = null;
    if (nextHeadingIdx < headingTexts.length) {
      const expected = headingTexts[nextHeadingIdx];
      if (trimmed.toLowerCase().startsWith(expected.toLowerCase())) {
        heading = expected;
        nextHeadingIdx++;
      }
    }

    if (trimmed.length <= MAX_SECTION_LENGTH) {
      const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
      sections.push({
        index: sections.length,
        text: trimmed,
        heading,
        wordOffset,
      });
      wordOffset += wordCount;
    } else {
      // Split long paragraph by sentences
      const sentences = trimmed.match(/[^.!?]+[.!?]+\s*/g) || [trimmed];
      let buffer = "";
      let isFirst = true;

      for (const sent of sentences) {
        if (buffer.length + sent.length <= MAX_SECTION_LENGTH) {
          buffer += sent;
        } else {
          if (buffer.trim()) {
            const wc = buffer.trim().split(/\s+/).filter(Boolean).length;
            sections.push({
              index: sections.length,
              text: buffer.trim(),
              heading: isFirst ? heading : null,
              wordOffset,
            });
            wordOffset += wc;
            isFirst = false;
          }
          buffer = sent;
        }
      }
      if (buffer.trim()) {
        const wc = buffer.trim().split(/\s+/).filter(Boolean).length;
        sections.push({
          index: sections.length,
          text: buffer.trim(),
          heading: isFirst ? heading : null,
          wordOffset,
        });
        wordOffset += wc;
      }
    }
  }

  return sections;
}

/** Count words in text before a given character index. */
function countWordsBeforeChar(text: string, charIndex: number): number {
  const before = text.slice(0, charIndex);
  return before.split(/\s+/).filter(Boolean).length;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useReadAloud(contentMarkdown: string): UseReadAloudReturn {
  const [status, setStatus] = useState<ReadAloudStatus>("idle");
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [highlightWordIndex, setHighlightWordIndex] = useState<number | null>(null);
  const [sectionAnnouncement, setSectionAnnouncement] = useState<string | null>(null);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [voicesReady, setVoicesReady] = useState(false);

  const sectionsRef = useRef<Section[]>([]);
  const currentSectionRef = useRef(0);
  const lastWordIdxRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);
  const playbackRateRef = useRef(1);
  const pendingPlayRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { sectionsRef.current = sections; }, [sections]);
  useEffect(() => { currentSectionRef.current = currentSectionIndex; }, [currentSectionIndex]);

  // Wait for browser voices to load
  useEffect(() => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    if (!synth) return;

    if (synth.getVoices().length > 0) {
      setVoicesReady(true);
      return;
    }

    const onVoices = () => {
      setVoicesReady(true);
    };
    synth.addEventListener("voiceschanged", onVoices);
    return () => synth.removeEventListener("voiceschanged", onVoices);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    playbackRateRef.current = rate;
    setPlaybackRateState(rate);
  }, []);

  const speakSection = useCallback(
    (section: Section): Promise<void> => {
      return new Promise<void>((resolve) => {
        if (stoppedRef.current) {
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(section.text);
        utterance.rate = playbackRateRef.current;
        utterance.pitch = 1;
        utterance.lang = "en-US";

        // Safety timeout: ~15 chars/sec at 1x, plus 5s buffer.
        // If onend never fires (Chrome bug), we auto-advance.
        const estimatedMs = (section.text.length / 15) * 1000 / playbackRateRef.current;
        const timeout = setTimeout(() => {
          resolve();
        }, estimatedMs + 5000);

        // Word highlighting via boundary events
        utterance.onboundary = (event) => {
          if (event.name === "word") {
            const localWordIdx = countWordsBeforeChar(section.text, event.charIndex);
            const globalIdx = section.wordOffset + localWordIdx;
            if (globalIdx !== lastWordIdxRef.current) {
              lastWordIdxRef.current = globalIdx;
              setHighlightWordIndex(globalIdx);
            }
          }
        };

        utterance.onend = () => {
          clearTimeout(timeout);
          resolve();
        };

        utterance.onerror = (event) => {
          clearTimeout(timeout);
          // "interrupted" and "canceled" are expected when stopping
          resolve();
        };

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
        currentSectionRef.current = i;

        const section = sectionList[i];

        // Section announcement
        if (section.heading) {
          setSectionAnnouncement(section.heading);
          setTimeout(() => setSectionAnnouncement(null), 3000);
        }

        await speakSection(section);
      }

      // Done
      if (!stoppedRef.current) {
        lastWordIdxRef.current = null;
        setHighlightWordIndex(null);
        setSectionAnnouncement(null);
        setStatus("idle");
      }
    },
    [speakSection]
  );

  const startPlayback = useCallback((markdown: string) => {
    window.speechSynthesis.cancel();
    stoppedRef.current = false;

    const built = buildSections(markdown);
    if (built.length === 0) {
      setStatus("idle");
      return;
    }

    setSections(built);
    sectionsRef.current = built;
    setCurrentSectionIndex(0);
    setStatus("playing");

    playAllSections(0, built).catch((err) => {
      console.error("Read-aloud error:", err);
      setStatus("idle");
    });
  }, [playAllSections]);

  // Auto-start when voices become ready (if play was pressed while loading)
  useEffect(() => {
    if (voicesReady && pendingPlayRef.current) {
      pendingPlayRef.current = false;
      startPlayback(contentMarkdown);
    }
  }, [voicesReady, contentMarkdown, startPlayback]);

  const play = useCallback(() => {
    if (status === "playing") return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (!voicesReady) {
      // Voices still loading — defer
      pendingPlayRef.current = true;
      setStatus("loading");
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
    lastWordIdxRef.current = null;
    setHighlightWordIndex(null);
    setSectionAnnouncement(null);
    setCurrentSectionIndex(0);
    setStatus("idle");
  }, []);

  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  const total = sections.length || 1;
  const progress = {
    current: currentSectionIndex + 1,
    total: sections.length,
    percent: sections.length > 0 ? Math.round(((currentSectionIndex + 1) / total) * 100) : 0,
  };

  return {
    status,
    play,
    pause,
    resume,
    stop,
    playbackRate,
    setPlaybackRate,
    progress,
    highlightWordIndex,
    sectionAnnouncement,
  };
}
