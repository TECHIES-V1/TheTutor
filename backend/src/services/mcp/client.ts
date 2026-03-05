import type { DiscoveredBook, MCPSearchResult, MCPFetchParseResult, BookSource } from "../../types";

const MCP_BASE_URL = process.env.MCP_BASE_URL ?? "https://futher-mcp-production.up.railway.app";

interface MCPError {
  error: string;
  code: string;
}

interface MCPSearchResponse {
  books?: RawSearchResult[];
  results?: RawSearchResult[];
  totalFound?: number;
  total?: number;
}

interface MCPFetchParseResponse {
  title?: string;
  authors?: Array<string | { name: string }>;
  summary?: string;
  chapters?: Array<{ title: string; content: string }>;
  content?: {
    summary?: string;
    chapters?: Array<{ title: string; content: string }>;
    totalPages?: number;
    wordCount?: number;
  };
  totalPages?: number;
  wordCount?: number;
}

// ── Health Check ──────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ── Discovery Search ──────────────────────────────────────────────────────

interface DiscoverySearchParams {
  query: string;
  sources?: BookSource[];
  limit?: number;
}

interface RawSearchResult {
  id: string | number;
  title: string;
  authors?: Array<string | { name: string }>;
  source: string;
  downloadUrl?: string;
  download_url?: string;
  format?: string;
  description?: string;
  subjects?: string[];
  publishYear?: number;
  publish_year?: number;
}

export async function discoverySearch(
  params: DiscoverySearchParams
): Promise<MCPSearchResult> {
  const { query, sources, limit = 18 } = params;

  const searchParams = new URLSearchParams({
    query,
    limit: String(limit),
  });

  if (sources?.length) {
    searchParams.set("sources", sources.join(","));
  }

  const response = await fetch(
    `${MCP_BASE_URL}/discovery/search?${searchParams.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Unknown MCP error",
      code: "UNKNOWN",
    })) as MCPError;
    throw new Error(`MCP search failed: ${error.error}`);
  }

  const data = await response.json() as MCPSearchResponse;

  // Normalize the response to our DiscoveredBook format
  const books: DiscoveredBook[] = (data.books || data.results || []).map(
    (book: RawSearchResult) => ({
      id: String(book.id),
      title: book.title,
      authors: normalizeAuthors(book.authors),
      source: book.source as BookSource,
      downloadUrl: book.downloadUrl || book.download_url,
      format: book.format,
      description: book.description,
      subjects: book.subjects,
      publishYear: book.publishYear || book.publish_year,
    })
  );

  return {
    books,
    totalFound: data.totalFound || data.total || books.length,
    query,
  };
}

// ── Pipeline Topic ────────────────────────────────────────────────────────

interface PipelineTopicParams {
  query: string;
  limit?: number;
  downloadLimit?: number;
}

export async function pipelineTopic(
  params: PipelineTopicParams
): Promise<MCPSearchResult> {
  const { query, limit = 18, downloadLimit = 5 } = params;

  const response = await fetch(`${MCP_BASE_URL}/pipeline/topic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      limit,
      downloadLimit,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Unknown MCP error",
      code: "UNKNOWN",
    })) as MCPError;
    throw new Error(`MCP pipeline/topic failed: ${error.error}`);
  }

  const data = await response.json() as MCPSearchResponse;

  const books: DiscoveredBook[] = (data.books || data.results || []).map(
    (book: RawSearchResult) => ({
      id: String(book.id),
      title: book.title,
      authors: normalizeAuthors(book.authors),
      source: book.source as BookSource,
      downloadUrl: book.downloadUrl || book.download_url,
      format: book.format,
      description: book.description,
      subjects: book.subjects,
      publishYear: book.publishYear || book.publish_year,
    })
  );

  return {
    books,
    totalFound: data.totalFound || data.total || books.length,
    query,
  };
}

// ── Fetch and Parse ───────────────────────────────────────────────────────

interface FetchParseParams {
  url: string;
  limitPages?: number;
  limitChapters?: number;
}

export async function fetchAndParse(
  params: FetchParseParams
): Promise<MCPFetchParseResult> {
  const { url, limitPages = 50, limitChapters = 10 } = params;

  const response = await fetch(`${MCP_BASE_URL}/pipeline/fetch-parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      limitPages,
      limitChapters,
    }),
    signal: AbortSignal.timeout(120000), // 2 minutes for parsing
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Unknown MCP error",
      code: "UNKNOWN",
    })) as MCPError;
    return {
      success: false,
      title: "",
      authors: [],
      content: { summary: "", chapters: [] },
      error: error.error,
    };
  }

  const data = await response.json() as MCPFetchParseResponse;

  return {
    success: true,
    title: data.title || "",
    authors: normalizeAuthors(data.authors),
    content: {
      summary: data.summary || data.content?.summary || "",
      chapters: (data.chapters || data.content?.chapters || []).map(
        (ch: { title: string; content: string }, idx: number) => ({
          title: ch.title,
          content: ch.content,
          order: idx,
        })
      ),
      totalPages: data.totalPages || data.content?.totalPages,
      wordCount: data.wordCount || data.content?.wordCount,
    },
  };
}

// ── Helper Functions ──────────────────────────────────────────────────────

function normalizeAuthors(
  authors: Array<string | { name: string }> | undefined
): string[] {
  if (!authors) return [];
  return authors.map((a) => (typeof a === "string" ? a : a.name));
}
