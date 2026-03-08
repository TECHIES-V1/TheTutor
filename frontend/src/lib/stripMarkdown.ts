/**
 * Strip markdown formatting to produce plain text suitable for speech synthesis.
 * Ported from backend/src/services/polly/pollyService.ts.
 */
export function stripMarkdown(md: string): string {
  return (
    md
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
      .replace(/~~([^~]+)~~/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^>\s*/gm, "")
      .replace(/^[-*_]{3,}\s*$/gm, "")
      .replace(/<[^>]+>/g, "")
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
