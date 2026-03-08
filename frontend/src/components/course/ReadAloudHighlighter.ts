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

/**
 * DOM-based word highlighter for read-aloud.
 * Walks text nodes in the content container, maps global word indices to DOM positions,
 * and highlights the current word using a temporary <mark> wrapper.
 */
export function ReadAloudHighlighter({
  containerRef,
  highlightWordIndex,
  active,
}: ReadAloudHighlighterProps) {
  const wordMapRef = useRef<WordLocation[]>([]);
  const activeMarkRef = useRef<HTMLElement | null>(null);
  const builtForRef = useRef<HTMLElement | null>(null);

  // Build word map from DOM text nodes
  const buildWordMap = useCallback(() => {
    const container = containerRef.current;
    if (!container || builtForRef.current === container) return;

    const words: WordLocation[] = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);

    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text | null)) {
      const text = textNode.textContent ?? "";
      // Match word boundaries
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

  // Rebuild word map when container content changes
  useEffect(() => {
    if (!active) return;

    buildWordMap();

    // Observe mutations to rebuild if content changes
    const container = containerRef.current;
    if (!container) return;

    const observer = new MutationObserver(() => {
      builtForRef.current = null;
      buildWordMap();
    });

    observer.observe(container, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [active, buildWordMap, containerRef]);

  // Apply/remove highlight
  useEffect(() => {
    // Remove previous highlight
    if (activeMarkRef.current) {
      const mark = activeMarkRef.current;
      const parent = mark.parentNode;
      if (parent) {
        // Replace <mark> with its text content
        const textNode = document.createTextNode(mark.textContent ?? "");
        parent.replaceChild(textNode, mark);
        // Normalize to merge adjacent text nodes
        parent.normalize();
        // Rebuild word map since DOM changed
        builtForRef.current = null;
        buildWordMap();
      }
      activeMarkRef.current = null;
    }

    if (highlightWordIndex === null || !active) return;

    const words = wordMapRef.current;
    if (highlightWordIndex >= words.length) return;

    const { node, start, end } = words[highlightWordIndex];

    // Verify node is still in document
    if (!node.parentNode || !document.contains(node)) return;

    try {
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);

      const mark = document.createElement("mark");
      mark.className = "read-aloud-active";
      range.surroundContents(mark);

      activeMarkRef.current = mark;

      // Scroll into view smoothly
      mark.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      // Range operations can fail if DOM structure changed
    }
  }, [highlightWordIndex, active, buildWordMap]);

  // Cleanup on unmount or deactivation
  useEffect(() => {
    if (active) return;

    if (activeMarkRef.current) {
      const mark = activeMarkRef.current;
      const parent = mark.parentNode;
      if (parent) {
        const textNode = document.createTextNode(mark.textContent ?? "");
        parent.replaceChild(textNode, mark);
        parent.normalize();
      }
      activeMarkRef.current = null;
    }
    wordMapRef.current = [];
    builtForRef.current = null;
  }, [active]);

  // This is a logic-only component, no UI
  return null;
}
