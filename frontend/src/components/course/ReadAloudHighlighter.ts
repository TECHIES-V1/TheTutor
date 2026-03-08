"use client";

import { useEffect, useRef, useCallback } from "react";

interface WordLocation {
  node: Text;
  start: number;
  end: number;
}

interface ReadAloudHighlighterProps {
  containerRef: React.RefObject<HTMLElement | null>;
  highlightWordIndex: number | null;
  active: boolean;
}

const supportsCustomHighlight =
  typeof CSS !== "undefined" && "highlights" in CSS;

// Inject ::highlight(read-aloud) CSS at runtime so it can't be stripped
// by Tailwind v4 / Lightning CSS during build.
const HIGHLIGHT_STYLE_ID = "read-aloud-highlight-style";
function ensureHighlightCSS() {
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = [
    "::highlight(read-aloud) { background-color: rgba(212, 175, 55, 0.25); color: inherit; }",
    ".read-aloud-active { background-color: rgba(212, 175, 55, 0.25); color: inherit; border-radius: 2px; padding: 0 1px; }",
  ].join("\n");
  document.head.appendChild(style);
}

/**
 * Word highlighter for read-aloud.
 *
 * Primary path: CSS Custom Highlight API — creates Range objects without
 * touching the DOM, so no MutationObserver feedback loops or normalize() calls.
 *
 * Fallback path: <mark> element wrapping with a mutation guard for older browsers.
 */
export function ReadAloudHighlighter({
  containerRef,
  highlightWordIndex,
  active,
}: ReadAloudHighlighterProps) {
  const wordMapRef = useRef<WordLocation[]>([]);
  const builtForRef = useRef<HTMLElement | null>(null);

  // Fallback refs (only used when Custom Highlight API is unavailable)
  const activeMarkRef = useRef<HTMLElement | null>(null);
  const isMutatingRef = useRef(false);

  // Inject highlight CSS on mount (runtime, bypasses build-time CSS stripping)
  useEffect(() => {
    ensureHighlightCSS();
  }, []);

  // Build word map from DOM text nodes (one-time per activation).
  // Skips <pre> blocks to match stripMarkdown() which removes code fences.
  const buildWordMap = useCallback(() => {
    const container = containerRef.current;
    if (!container || builtForRef.current === container) return;

    const words: WordLocation[] = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node: Node) {
          // Skip text inside <pre> (fenced code blocks are removed by stripMarkdown)
          let el = node.parentElement;
          while (el && el !== container) {
            if (el.tagName === "PRE") return NodeFilter.FILTER_REJECT;
            el = el.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text | null)) {
      const text = textNode.textContent ?? "";
      const regex = /\S+/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        words.push({
          node: textNode,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }

    wordMapRef.current = words;
    builtForRef.current = container;
  }, [containerRef]);

  // Build word map once when activated
  useEffect(() => {
    if (!active) return;
    buildWordMap();

    // Only observe for external content changes (not needed for Custom Highlight
    // path, but useful if content is lazy-loaded). Guard against self-mutations.
    if (!supportsCustomHighlight) {
      const container = containerRef.current;
      if (!container) return;

      const observer = new MutationObserver(() => {
        if (isMutatingRef.current) return;
        builtForRef.current = null;
        buildWordMap();
      });
      observer.observe(container, { childList: true, subtree: true, characterData: true });
      return () => observer.disconnect();
    }
  }, [active, buildWordMap, containerRef]);

  // Apply highlight using CSS Custom Highlight API (primary path)
  useEffect(() => {
    if (!supportsCustomHighlight) return;

    if (highlightWordIndex === null || !active) {
      CSS.highlights.delete("read-aloud");
      return;
    }

    const words = wordMapRef.current;
    if (highlightWordIndex >= words.length) return;

    const { node, start, end } = words[highlightWordIndex];
    if (!node.parentNode || !document.contains(node)) return;

    try {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);

      const highlight = new Highlight(range);
      CSS.highlights.set("read-aloud", highlight);

      // Scroll the word into view
      const rect = range.getBoundingClientRect();
      const viewportH = window.innerHeight;
      if (rect.top < 80 || rect.bottom > viewportH - 80) {
        const el = node.parentElement;
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch {
      // Range can fail if DOM changed underneath
    }
  }, [highlightWordIndex, active]);

  // Fallback: <mark> wrapping (only for browsers without Custom Highlight API)
  useEffect(() => {
    if (supportsCustomHighlight) return;

    // Remove previous mark
    if (activeMarkRef.current) {
      const mark = activeMarkRef.current;
      const parent = mark.parentNode;
      if (parent) {
        isMutatingRef.current = true;
        const textNode = document.createTextNode(mark.textContent ?? "");
        parent.replaceChild(textNode, mark);
        parent.normalize();
        builtForRef.current = null;
        buildWordMap();
        isMutatingRef.current = false;
      }
      activeMarkRef.current = null;
    }

    if (highlightWordIndex === null || !active) return;

    const words = wordMapRef.current;
    if (highlightWordIndex >= words.length) return;

    const { node, start, end } = words[highlightWordIndex];
    if (!node.parentNode || !document.contains(node)) return;

    try {
      isMutatingRef.current = true;
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);

      const mark = document.createElement("mark");
      mark.className = "read-aloud-active";
      range.surroundContents(mark);
      activeMarkRef.current = mark;
      isMutatingRef.current = false;

      mark.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      isMutatingRef.current = false;
    }
  }, [highlightWordIndex, active, buildWordMap]);

  // Cleanup on deactivation or unmount
  useEffect(() => {
    if (active) return;

    // Clean up Custom Highlight API
    if (supportsCustomHighlight) {
      CSS.highlights.delete("read-aloud");
    }

    // Clean up fallback <mark>
    if (activeMarkRef.current) {
      const mark = activeMarkRef.current;
      const parent = mark.parentNode;
      if (parent) {
        isMutatingRef.current = true;
        const textNode = document.createTextNode(mark.textContent ?? "");
        parent.replaceChild(textNode, mark);
        parent.normalize();
        isMutatingRef.current = false;
      }
      activeMarkRef.current = null;
    }

    wordMapRef.current = [];
    builtForRef.current = null;
  }, [active]);

  return null;
}
