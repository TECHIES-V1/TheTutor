import {
  checkHealth,
  discoverySearch,
  fetchAndParse,
} from "./client";
import { filterBooks } from "../ai/nova";
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
  const searchQuery = confirmedSubject || topic || "";

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

  // Search for books
  yield {
    type: "status",
    data: {
      phase: "resource_retrieval",
      message: `Searching for textbooks about "${searchQuery}"...`,
      progress: 10,
    },
  };

  const searchResult = await discoverySearch({
    query: searchQuery,
    limit: 18,
  });

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
    searchQuery,
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
      logger.error({ err: error, bookTitle: book.title }, "Failed to parse book");
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
    yield {
      type: "error",
      data: {
        code: "PARSING_FAILED",
        message: "Failed to parse any textbooks. Please try again.",
        retryable: true,
        phase: "parsing",
      },
    };
    throw new Error("No books could be parsed");
  }

  return {
    selectedBooks,
    bookContexts,
    resourceIds,
  };
}
