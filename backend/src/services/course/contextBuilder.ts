import type { BookContext, GenerationContext, OnboardingData } from "../../types";

// Maximum total content length to send to the AI (in characters)
const MAX_CONTENT_LENGTH = 50000;

// Maximum content per chapter (in characters)
const MAX_CHAPTER_LENGTH = 2000;

// ── Build Generation Context ──────────────────────────────────────────────

export function buildGenerationContext(
  onboardingData: OnboardingData,
  bookContexts: BookContext[]
): GenerationContext {
  // First pass: trim chapters to max length
  const trimmedBooks = bookContexts.map((book) => ({
    ...book,
    relevantChapters: book.relevantChapters.map((ch) => ({
      title: ch.title,
      contentSnippet:
        ch.contentSnippet.length > MAX_CHAPTER_LENGTH
          ? ch.contentSnippet.substring(0, MAX_CHAPTER_LENGTH) + "..."
          : ch.contentSnippet,
    })),
  }));

  // Calculate total length
  let totalLength = 0;
  for (const book of trimmedBooks) {
    for (const ch of book.relevantChapters) {
      totalLength += ch.contentSnippet.length;
    }
  }

  // If still too long, reduce chapters per book
  let finalBooks = trimmedBooks;
  if (totalLength > MAX_CONTENT_LENGTH) {
    const reduction = MAX_CONTENT_LENGTH / totalLength;
    finalBooks = trimmedBooks.map((book) => {
      const keepChapters = Math.max(
        1,
        Math.floor(book.relevantChapters.length * reduction)
      );
      return {
        ...book,
        relevantChapters: book.relevantChapters.slice(0, keepChapters),
      };
    });

    // Recalculate
    totalLength = 0;
    for (const book of finalBooks) {
      for (const ch of book.relevantChapters) {
        totalLength += ch.contentSnippet.length;
      }
    }
  }

  return {
    onboardingData,
    books: finalBooks,
    totalContentLength: totalLength,
  };
}

// ── Extract Keywords from Topic ───────────────────────────────────────────

export function extractKeywords(topic: string): string[] {
  // Remove common stop words and extract meaningful keywords
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "are",
    "were",
    "been",
    "be",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "shall",
    "can",
    "need",
    "want",
    "learn",
    "learning",
    "study",
    "studying",
    "understand",
    "understanding",
    "how",
    "what",
    "why",
    "when",
    "where",
    "which",
    "who",
    "i",
    "me",
    "my",
    "myself",
    "we",
    "our",
    "ours",
    "you",
    "your",
    "yours",
  ]);

  return topic
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

// ── Score Chapter Relevance ───────────────────────────────────────────────

export function scoreChapterRelevance(
  chapter: { title: string; contentSnippet: string },
  keywords: string[]
): number {
  const text = `${chapter.title} ${chapter.contentSnippet}`.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    // Title matches are worth more
    if (chapter.title.toLowerCase().includes(keyword)) {
      score += 10;
    }
    // Count occurrences in content
    const regex = new RegExp(keyword, "gi");
    const matches = text.match(regex);
    if (matches) {
      score += matches.length;
    }
  }

  return score;
}

// ── Filter and Rank Chapters ──────────────────────────────────────────────

export function rankChaptersByRelevance(
  bookContexts: BookContext[],
  topic: string,
  maxChaptersPerBook: number = 5
): BookContext[] {
  const keywords = extractKeywords(topic);

  return bookContexts.map((book) => {
    const scoredChapters = book.relevantChapters.map((ch) => ({
      ...ch,
      score: scoreChapterRelevance(ch, keywords),
    }));

    // Sort by relevance score and take top N
    const rankedChapters = scoredChapters
      .sort((a, b) => b.score - a.score)
      .slice(0, maxChaptersPerBook)
      .map(({ score: _score, ...ch }) => ch);

    return {
      ...book,
      relevantChapters: rankedChapters,
    };
  });
}
