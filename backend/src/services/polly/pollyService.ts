import { SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { pollyClient, POLLY_CONFIG } from "../../config/polly";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TextChunk {
  index: number;
  plainText: string;
  startOffset: number;
  endOffset: number;
  sectionHeading: string | null;
  wordOffset: number;
}

export interface SpeechMark {
  time: number;
  type: "word" | "sentence";
  start: number;
  end: number;
  value: string;
}

// ─── Markdown → Plain Text Stripping ────────────────────────────────────────

function stripMarkdown(md: string): string {
  return (
    md
      // Code blocks → omit
      .replace(/```[\s\S]*?```/g, "")
      // Inline code
      .replace(/`([^`]+)`/g, "$1")
      // Images
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Links: keep text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      // Bold / italic
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
      // Strikethrough
      .replace(/~~([^~]+)~~/g, "$1")
      // Headings markers (keep text)
      .replace(/^#{1,6}\s+/gm, "")
      // Blockquote markers
      .replace(/^>\s*/gm, "")
      // Horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // HTML tags
      .replace(/<[^>]+>/g, "")
      // List markers
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Multiple newlines → single
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

// ─── Chunking ───────────────────────────────────────────────────────────────

/**
 * Split markdown into chunks suitable for Polly (under 2900 chars each).
 * Preserves section headings for announcements.
 */
export function chunkMarkdown(markdown: string): TextChunk[] {
  const { maxChunkLength } = POLLY_CONFIG;
  const chunks: TextChunk[] = [];
  let globalOffset = 0;
  let wordOffset = 0;

  // Split into sections by headings
  const sectionRegex = /^(#{1,6})\s+(.+)$/gm;
  const sections: { heading: string | null; body: string; start: number }[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      const body = markdown.slice(lastIndex, match.index);
      if (body.trim()) {
        sections.push({ heading: null, body, start: lastIndex });
      }
    }
    // Find the end of this section (next heading or EOF)
    const nextMatch = sectionRegex.exec(markdown);
    const endIdx = nextMatch ? nextMatch.index : markdown.length;
    if (nextMatch) sectionRegex.lastIndex = nextMatch.index; // rewind

    const sectionBody = markdown.slice(match.index + match[0].length, endIdx);
    sections.push({
      heading: match[2].trim(),
      body: sectionBody,
      start: match.index,
    });
    lastIndex = endIdx;
  }

  // If no headings found or trailing content
  if (lastIndex < markdown.length) {
    const body = markdown.slice(lastIndex);
    if (body.trim()) {
      sections.push({ heading: sections.length === 0 ? null : null, body, start: lastIndex });
    }
  }

  // If no sections at all, treat entire markdown as one section
  if (sections.length === 0) {
    sections.push({ heading: null, body: markdown, start: 0 });
  }

  for (const section of sections) {
    const plainText = stripMarkdown(section.body).trim();
    if (!plainText) continue;

    if (plainText.length <= maxChunkLength) {
      const wordCount = plainText.split(/\s+/).filter(Boolean).length;
      chunks.push({
        index: chunks.length,
        plainText,
        startOffset: globalOffset,
        endOffset: globalOffset + plainText.length,
        sectionHeading: section.heading,
        wordOffset,
      });
      globalOffset += plainText.length;
      wordOffset += wordCount;
    } else {
      // Split at paragraph boundaries, then sentence boundaries
      const paragraphs = plainText.split(/\n\n+/);
      let buffer = "";
      let isFirst = true;

      for (const para of paragraphs) {
        if (buffer.length + para.length + 2 <= maxChunkLength) {
          buffer += (buffer ? "\n\n" : "") + para;
        } else {
          // Flush buffer
          if (buffer.trim()) {
            const wordCount = buffer.trim().split(/\s+/).filter(Boolean).length;
            chunks.push({
              index: chunks.length,
              plainText: buffer.trim(),
              startOffset: globalOffset,
              endOffset: globalOffset + buffer.trim().length,
              sectionHeading: isFirst ? section.heading : null,
              wordOffset,
            });
            globalOffset += buffer.trim().length;
            wordOffset += wordCount;
            isFirst = false;
          }

          // If single paragraph exceeds limit, split by sentences
          if (para.length > maxChunkLength) {
            const sentences = para.match(/[^.!?]+[.!?]+\s*/g) || [para];
            let sentBuf = "";
            for (const sent of sentences) {
              if (sentBuf.length + sent.length <= maxChunkLength) {
                sentBuf += sent;
              } else {
                if (sentBuf.trim()) {
                  const wc = sentBuf.trim().split(/\s+/).filter(Boolean).length;
                  chunks.push({
                    index: chunks.length,
                    plainText: sentBuf.trim(),
                    startOffset: globalOffset,
                    endOffset: globalOffset + sentBuf.trim().length,
                    sectionHeading: isFirst ? section.heading : null,
                    wordOffset,
                  });
                  globalOffset += sentBuf.trim().length;
                  wordOffset += wc;
                  isFirst = false;
                }
                sentBuf = sent;
              }
            }
            buffer = sentBuf;
          } else {
            buffer = para;
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        const wordCount = buffer.trim().split(/\s+/).filter(Boolean).length;
        chunks.push({
          index: chunks.length,
          plainText: buffer.trim(),
          startOffset: globalOffset,
          endOffset: globalOffset + buffer.trim().length,
          sectionHeading: isFirst ? section.heading : null,
          wordOffset,
        });
        globalOffset += buffer.trim().length;
        wordOffset += wordCount;
      }
    }
  }

  return chunks;
}

// ─── Polly Synthesis ────────────────────────────────────────────────────────

export async function synthesizeChunk(text: string): Promise<Buffer> {
  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: POLLY_CONFIG.outputFormat,
    VoiceId: POLLY_CONFIG.voiceId,
    Engine: POLLY_CONFIG.engine,
    SampleRate: POLLY_CONFIG.sampleRate,
  });

  const response = await pollyClient.send(command);
  if (!response.AudioStream) {
    throw new Error("Polly returned no audio stream");
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.AudioStream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function getSpeechMarksForChunk(text: string): Promise<SpeechMark[]> {
  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: "json",
    VoiceId: POLLY_CONFIG.voiceId,
    Engine: POLLY_CONFIG.engine,
    SpeechMarkTypes: ["word", "sentence"],
  });

  const response = await pollyClient.send(command);
  if (!response.AudioStream) {
    return [];
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.AudioStream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  const text_ = Buffer.concat(chunks).toString("utf-8");

  // Polly returns JSONL (one JSON object per line)
  return text_
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const parsed = JSON.parse(line);
      return {
        time: parsed.time,
        type: parsed.type,
        start: parsed.start,
        end: parsed.end,
        value: parsed.value,
      } as SpeechMark;
    });
}

export async function synthesizeWithMarks(
  text: string
): Promise<{ audio: Buffer; marks: SpeechMark[] }> {
  const [audio, marks] = await Promise.all([
    synthesizeChunk(text),
    getSpeechMarksForChunk(text),
  ]);
  return { audio, marks };
}
