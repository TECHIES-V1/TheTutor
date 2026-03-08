import {
  checkHealth,
  keywordSearch,
  discoverySearch,
  fetchAndParse,
} from "./client";
import { filterBooks, generateTextbookSearchQueries } from "../ai/nova";
import { Resource } from "../../models/Resource";
import type {
  DiscoveredBook,
  BookContext,
  SSEEvent,
  OnboardingData,
} from "../../types";
import { logger } from "../../config/logger";

// ── Discovery Pipeline ────────────────────────────────────────────────────

export interface DiscoveryResult {
  selectedBooks: DiscoveredBook[];
  bookContexts: BookContext[];
  resourceIds: string[];
}

export async function* discoverAndParseBooks(
  onboardingData: OnboardingData
): AsyncGenerator<SSEEvent, DiscoveryResult> {
  const { topic, level, confirmedSubject } = onboardingData;
  // Use topic (what the user typed) for book search, NOT confirmedSubject (AI-generated course title)
  const rawQuery = topic || confirmedSubject || "";

  // Use AI to generate proper textbook search queries (e.g., "neumorphism" → ["CSS design patterns", "UI design", ...])
  yield {
    type: "status",
    data: {
      phase: "resource_retrieval",
      message: "Generating textbook search queries...",
    },
  };

  let aiQueries: string[] = [];
  try {
    aiQueries = await generateTextbookSearchQueries(rawQuery, level || "beginner");
    logger.info({ aiQueries }, "[discovery] AI-generated search queries");
  } catch (err) {
    logger.warn({ err }, "[discovery] AI query generation failed, using raw topic");
  }

  // Deduplicate keywords
  const keywords: string[] = [];
  const seen = new Set<string>();
  for (const q of aiQueries) {
    const lower = q.toLowerCase().trim();
    if (!lower || seen.has(lower)) continue;
    seen.add(lower);
    keywords.push(q.trim());
  }
  // Add raw topic as fallback only if it's short (1-2 words)
  const rawWords = rawQuery.trim().split(/\s+/);
  if (rawWords.length <= 2) {
    const lower = rawQuery.toLowerCase().trim();
    if (!seen.has(lower)) keywords.push(rawQuery.trim());
  }

  // Check MCP health first
  yield {
    type: "status",
    data: {
      phase: "resource_retrieval",
      message: "Connecting to resource discovery service...",
    },
  };

  const isHealthy = await checkHealth();
  if (!isHealthy) {
    yield {
      type: "error",
      data: {
        code: "MCP_UNAVAILABLE",
        message: "Resource discovery service is unavailable. Please try again later.",
        retryable: true,
        phase: "resource_retrieval",
      },
    };
    throw new Error("MCP service unavailable");
  }

  // Primary: aggregated discovery search (returns download_links)
  let searchResult = { books: [] as DiscoveredBook[] };

  yield {
    type: "status",
    data: {
      phase: "resource_retrieval",
      message: `Searching for textbooks (${keywords.join(", ")})...`,
      progress: 10,
    },
  };

  // Try first 4 keywords via /discovery/search (aggregates Gutendex + OpenLibrary + Standard Ebooks)
  const primaryKeywords = keywords.slice(0, 4);
  for (const keyword of primaryKeywords) {
    try {
      searchResult = await discoverySearch({ query: keyword, limit: 18 });
      logger.info({ query: keyword, bookCount: searchResult.books.length }, "[discovery] Discovery search results");
      if (searchResult.books.length > 0) break;
    } catch (err) {
      logger.warn({ query: keyword, err }, "[discovery] Discovery search failed, trying next keyword");
      continue;
    }
  }

  // Fallback: try individual keywords via /search (wider OpenLibrary, may lack download URLs)
  if (searchResult.books.length === 0) {
    yield {
      type: "status",
      data: {
        phase: "resource_retrieval",
        message: `Broadening search...`,
        progress: 10,
      },
    };

    for (const keyword of keywords.slice(0, 4)) {
      try {
        searchResult = await keywordSearch({ keywords: [keyword], limit: 18 });
        logger.info({ keyword, bookCount: searchResult.books.length }, "[discovery] Keyword search fallback results");
        if (searchResult.books.length > 0) break;
      } catch (err) {
        logger.warn({ keyword, err }, "[discovery] Keyword search fallback failed");
        continue;
      }
    }
  }

  yield {
    type: "resources",
    data: {
      type: "discovered",
      count: searchResult.books.length,
      message: `Found ${searchResult.books.length} potential textbooks`,
    },
  };

  if (searchResult.books.length === 0) {
    yield {
      type: "error",
      data: {
        code: "MCP_UNAVAILABLE",
        message: "No textbooks found for this topic. Try a more general subject.",
        retryable: false,
        phase: "resource_retrieval",
      },
    };
    throw new Error("No books found");
  }

  // Filter books using AI
  yield {
    type: "status",
    data: {
      phase: "filtering",
      message: "Selecting the most relevant textbooks...",
      progress: 25,
    },
  };

  const selectedIndices = await filterBooks(
    rawQuery,
    level || "beginner",
    searchResult.books
  );

  // If AI didn't select any, take top 5
  const indicesToUse =
    selectedIndices.length > 0
      ? selectedIndices.slice(0, 5)
      : searchResult.books.slice(0, 5).map((_, i) => i);

  const selectedBooks = indicesToUse.map((i) => searchResult.books[i]);

  yield {
    type: "resources",
    data: {
      type: "selected",
      count: selectedBooks.length,
      books: selectedBooks.map((b) => ({
        title: b.title,
        authors: b.authors,
        source: b.source,
      })),
      message: `Selected ${selectedBooks.length} textbooks for parsing`,
    },
  };

  // Parse each selected book
  yield {
    type: "status",
    data: {
      phase: "parsing",
      message: "Downloading and parsing selected textbooks...",
      progress: 40,
    },
  };

  const bookContexts: BookContext[] = [];
  const resourceIds: string[] = [];

  for (let i = 0; i < selectedBooks.length; i++) {
    const book = selectedBooks[i];

    yield {
      type: "parsing_progress",
      data: {
        current: i + 1,
        total: selectedBooks.length,
        book: book.title,
        status: "downloading",
      },
    };

    // Check if we already have this resource parsed
    let resource = await Resource.findOne({
      source: book.source,
      externalId: book.id,
      parseStatus: "complete",
    });

    if (resource) {
      // Use cached parsed content
      yield {
        type: "parsing_progress",
        data: {
          current: i + 1,
          total: selectedBooks.length,
          book: book.title,
          status: "complete",
        },
      };

      if (resource.parsedContent) {
        bookContexts.push({
          title: resource.title,
          authors: resource.authors,
          relevantChapters: resource.parsedContent.chapters.slice(0, 5).map((ch) => ({
            title: ch.title,
            contentSnippet: ch.content.substring(0, 1000),
          })),
        });
      }
      resourceIds.push(resource._id.toString());
      continue;
    }

    // Need to parse this book
    if (!book.downloadUrl) {
      logger.warn(
        { bookTitle: book.title, bookId: book.id, source: book.source },
        "[discovery] Book has no downloadUrl, skipping parse"
      );
      yield {
        type: "parsing_progress",
        data: {
          current: i + 1,
          total: selectedBooks.length,
          book: book.title,
          status: "failed",
        },
      };
      continue;
    }

    yield {
      type: "parsing_progress",
      data: {
        current: i + 1,
        total: selectedBooks.length,
        book: book.title,
        status: "parsing",
      },
    };

    try {
      const parseResult = await fetchAndParse({
        url: book.downloadUrl,
        limitPages: 50,
        limitChapters: 10,
      });

      if (parseResult.success) {
        // Save to database
        resource = await Resource.findOneAndUpdate(
          { source: book.source, externalId: book.id },
          {
            source: book.source,
            externalId: book.id,
            title: book.title,
            authors: book.authors,
            downloadUrl: book.downloadUrl,
            format: book.format,
            description: book.description,
            subjects: book.subjects,
            publishYear: book.publishYear,
            parsedContent: parseResult.content,
            parseStatus: "complete",
          },
          { upsert: true, new: true }
        );

        bookContexts.push({
          title: book.title,
          authors: book.authors,
          relevantChapters: parseResult.content.chapters.slice(0, 5).map((ch) => ({
            title: ch.title,
            contentSnippet: ch.content.substring(0, 1000),
          })),
        });
        if (resource) {
          resourceIds.push(resource._id.toString());
        }

        yield {
          type: "parsing_progress",
          data: {
            current: i + 1,
            total: selectedBooks.length,
            book: book.title,
            status: "complete",
          },
        };
      } else {
        logger.warn(
          { bookTitle: book.title, downloadUrl: book.downloadUrl, error: parseResult.error },
          "[discovery] fetchAndParse returned success=false"
        );
        yield {
          type: "parsing_progress",
          data: {
            current: i + 1,
            total: selectedBooks.length,
            book: book.title,
            status: "failed",
          },
        };
      }
    } catch (error) {
      logger.error({ err: error, bookTitle: book.title, downloadUrl: book.downloadUrl }, "[discovery] fetchAndParse threw an exception");
      yield {
        type: "parsing_progress",
        data: {
          current: i + 1,
          total: selectedBooks.length,
          book: book.title,
          status: "failed",
        },
      };
    }

    // Update progress
    const progress = 40 + Math.round(((i + 1) / selectedBooks.length) * 30);
    yield {
      type: "status",
      data: {
        phase: "parsing",
        message: `Parsed ${i + 1} of ${selectedBooks.length} textbooks...`,
        progress,
      },
    };
  }

  if (bookContexts.length === 0) {
    logger.warn(
      { selectedCount: selectedBooks.length },
      "[discovery] No books could be parsed, continuing without book sources"
    );
    yield {
      type: "status",
      data: {
        phase: "parsing",
        message: "Could not parse textbooks — course will use AI knowledge only.",
        progress: 70,
      },
    };
  }

  return {
    selectedBooks,
    bookContexts,
    resourceIds,
  };
}
