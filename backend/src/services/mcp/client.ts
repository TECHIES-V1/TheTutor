import type { DiscoveredBook, MCPSearchResult, MCPFetchParseResult, BookSource } from "../../types";
import { logger } from "../../config/logger";

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

// ── Keyword Search (Smart OpenLibrary — /search) ─────────────────────────

interface KeywordSearchParams {
  keywords: string[];
  limit?: number;
}

interface RawSearchResult {
  id: string | number;
  source_id?: string | number;
  title: string;
  authors?: Array<string | { name: string }>;
  source: string;
  downloadUrl?: string;
  download_url?: string;
  download_links?: Array<{ format: string; url: string; label?: string }>;
  format?: string;
  description?: string;
  subjects?: string[];
  extra?: { subjects?: string[]; publishers?: string[] };
  publishYear?: number;
  publish_year?: number;
  year?: number;
}

/**
 * Smart OpenLibrary keyword search via /search endpoint.
 * Sends all keywords at once as repeated `keywords=` params.
 */
export async function keywordSearch(
  params: KeywordSearchParams
): Promise<MCPSearchResult> {
  const { keywords, limit = 18 } = params;

  const searchParams = new URLSearchParams({
    query: keywords.join(" "),
    limit: String(limit),
  });
  for (const kw of keywords) {
    searchParams.append("keywords", kw);
  }

  const response = await fetch(
    `${MCP_BASE_URL}/search?${searchParams.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`MCP keyword search failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = await response.json() as Record<string, unknown>;

  // Handle multiple response shapes: { books, results, responses, docs } or top-level array
  const rawBooks: RawSearchResult[] = (
    (data.books || data.results || data.responses || data.docs || (Array.isArray(data) ? data : [])) as RawSearchResult[]
  );

  const books: DiscoveredBook[] = rawBooks.map(
    (book: RawSearchResult) => ({
      id: String(book.id || ""),
      title: book.title || "",
      authors: normalizeAuthors(book.authors),
      source: (book.source || "openlibrary") as BookSource,
      downloadUrl: book.downloadUrl || book.download_url || extractDownloadUrl(book.download_links),
      format: book.format,
      description: book.description,
      subjects: book.subjects,
      publishYear: book.publishYear || book.publish_year,
    })
  ).filter((b) => b.title);

  return {
    books,
    totalFound: (data.totalFound || data.total || data.numFound || books.length) as number,
    query: keywords.join(", "),
  };
}

// ── Discovery Search (Aggregate — /discovery/search) ─────────────────────

interface DiscoverySearchParams {
  query: string;
  sources?: BookSource[];
  limit?: number;
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
    const body = await response.text().catch(() => "");
    throw new Error(`MCP discovery search failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = await response.json() as Record<string, unknown>;
  logger.info({ query, responseKeys: Object.keys(data) }, "[discoverySearch] Raw response shape");

  // Response is { responses: [{ source, books: [...] }, ...] } — flatten all books
  let rawBooks: RawSearchResult[];
  if (Array.isArray(data.responses)) {
    rawBooks = (data.responses as Array<{ books?: RawSearchResult[] }>)
      .flatMap((r) => r.books || []);
  } else {
    rawBooks = (data.books || data.results || []) as RawSearchResult[];
  }

  const books: DiscoveredBook[] = rawBooks.map(
    (book: RawSearchResult) => ({
      id: String(book.source_id || book.id || ""),
      title: book.title,
      authors: normalizeAuthors(book.authors),
      source: (book.source || "openlibrary") as BookSource,
      downloadUrl: book.downloadUrl || book.download_url || extractDownloadUrl(book.download_links),
      format: book.format,
      description: book.description,
      subjects: book.subjects || book.extra?.subjects,
      publishYear: book.publishYear || book.publish_year || book.year,
    })
  ).filter((b) => b.title);

  return {
    books,
    totalFound: books.length,
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
    const body = await response.text().catch(() => "");
    let errorMessage = `MCP pipeline/topic failed (${response.status})`;
    try {
      const parsed = JSON.parse(body) as MCPError;
      errorMessage = parsed.error || errorMessage;
    } catch {
      if (body) errorMessage += `: ${body.slice(0, 200)}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json() as MCPSearchResponse;

  const books: DiscoveredBook[] = (data.books || data.results || []).map(
    (book: RawSearchResult) => ({
      id: String(book.id),
      title: book.title,
      authors: normalizeAuthors(book.authors),
      source: book.source as BookSource,
      downloadUrl: book.downloadUrl || book.download_url || extractDownloadUrl(book.download_links),
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
    const status = response.status;
    const body = await response.text().catch(() => "");
    let errorMessage = `MCP fetch-parse failed (${status})`;
    try {
      const parsed = JSON.parse(body) as MCPError;
      errorMessage = parsed.error || errorMessage;
    } catch {
      if (body) errorMessage += `: ${body.slice(0, 200)}`;
    }
    return {
      success: false,
      title: "",
      authors: [],
      content: { summary: "", chapters: [] },
      error: errorMessage,
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

function extractDownloadUrl(
  links?: Array<{ format: string; url: string }>
): string | undefined {
  if (!links?.length) return undefined;
  const pdf = links.find((l) => l.format?.toLowerCase().includes("pdf"));
  if (pdf) return pdf.url;
  const epub = links.find((l) => l.format?.toLowerCase().includes("epub"));
  if (epub) return epub.url;
  return links[0].url;
}

function normalizeAuthors(
  authors: Array<string | { name: string }> | undefined
): string[] {
  if (!authors) return [];
  return authors.map((a) => (typeof a === "string" ? a : a.name));
}
