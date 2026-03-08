"use client";

import { useEffect, useRef, useCallback } from "react";

interface ReadAloudHighlighterProps {
  containerRef: React.RefObject<HTMLElement | null>;
  activeSectionText: string | null;
  active: boolean;
}

// Block-level tags that can be highlighted
const BLOCK_SELECTOR = "p, li, h1, h2, h3, h4, h5, h6, blockquote";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Collapse whitespace and lowercase for fuzzy text comparison. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Find the block element whose text best matches the spoken section.
 *
 * Strategy: try matching with decreasing key lengths (4 words → 3 → 2 → 1).
 * Searches forward from `startFrom` first (speech is sequential),
 * then wraps around as a fallback.
 */
function findMatchingBlock(
  blocks: HTMLElement[],
  sectionText: string,
  startFrom: number
): number {
  const norm = normalize(sectionText);
  const words = norm.split(" ");

  // Try progressively shorter prefixes — longer = more specific
  for (let len = Math.min(5, words.length); len >= 1; len--) {
    const key = words.slice(0, len).join(" ");

    // Forward search from last position
    for (let i = startFrom; i < blocks.length; i++) {
      const blockText = normalize(blocks[i].textContent ?? "");
      if (blockText.includes(key)) return i;
    }
    // Wrap-around fallback
    for (let i = 0; i < startFrom; i++) {
      const blockText = normalize(blocks[i].textContent ?? "");
      if (blockText.includes(key)) return i;
    }
  }

  return -1;
}

// ─── Runtime CSS (bypasses build-time stripping) ────────────────────────────

const STYLE_ID = "read-aloud-highlight-style";
function ensureCSS() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `.read-aloud-line {
  background-color: rgba(212, 175, 55, 0.10);
  border-left: 3px solid rgba(212, 175, 55, 0.8);
  padding-left: 10px;
  margin-left: -13px;
  border-radius: 6px;
  transition: background-color 0.25s ease, border-color 0.25s ease;
}`;
  document.head.appendChild(style);
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Line highlighter for read-aloud.
 *
 * Matches the currently spoken section text against DOM block elements
 * by content comparison — no word-index alignment needed.
 * Highlights the matching element with a gold accent border.
 */
export function ReadAloudHighlighter({
  containerRef,
  activeSectionText,
  active,
}: ReadAloudHighlighterProps) {
  const blocksRef = useRef<HTMLElement[]>([]);
  const lastMatchRef = useRef(0);
  const activeElRef = useRef<HTMLElement | null>(null);

  useEffect(() => { ensureCSS(); }, []);

  // Collect block elements when activated
  const collectBlocks = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    blocksRef.current = Array.from(container.querySelectorAll(BLOCK_SELECTOR));
    lastMatchRef.current = 0;
  }, [containerRef]);

  useEffect(() => {
    if (active) collectBlocks();
  }, [active, collectBlocks]);

  // Highlight the matching block when section text changes
  useEffect(() => {
    if (!activeSectionText || !active) {
      // Clear highlight
      if (activeElRef.current) {
        activeElRef.current.classList.remove("read-aloud-line");
        activeElRef.current = null;
      }
      return;
    }

    const blocks = blocksRef.current;
    if (blocks.length === 0) return;

    const idx = findMatchingBlock(blocks, activeSectionText, lastMatchRef.current);
    if (idx === -1) return;

    const el = blocks[idx];

    // Same element — skip
    if (el === activeElRef.current) return;

    // Remove old
    if (activeElRef.current) {
      activeElRef.current.classList.remove("read-aloud-line");
    }

    // Apply new
    el.classList.add("read-aloud-line");
    activeElRef.current = el;
    lastMatchRef.current = idx;

    // Smart scroll — only when the element is near viewport edges
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.top < 60 || rect.bottom > vh - 60) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSectionText, active]);

  // Cleanup on deactivation / unmount
  useEffect(() => {
    if (active) return;
    if (activeElRef.current) {
      activeElRef.current.classList.remove("read-aloud-line");
      activeElRef.current = null;
    }
    blocksRef.current = [];
    lastMatchRef.current = 0;
  }, [active]);

  return null;
}
