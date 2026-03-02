"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkHealth = checkHealth;
exports.discoverySearch = discoverySearch;
exports.pipelineTopic = pipelineTopic;
exports.fetchAndParse = fetchAndParse;
const MCP_BASE_URL = process.env.MCP_BASE_URL ?? "https://futher-mcp-production.up.railway.app";
// ── Health Check ──────────────────────────────────────────────────────────
async function checkHealth() {
    try {
        const response = await fetch(`${MCP_BASE_URL}/health`, {
            method: "GET",
            signal: AbortSignal.timeout(5000),
        });
        return response.ok;
    }
    catch {
        return false;
    }
}
async function discoverySearch(params) {
    const { query, sources, limit = 18 } = params;
    const searchParams = new URLSearchParams({
        query,
        limit: String(limit),
    });
    if (sources?.length) {
        searchParams.set("sources", sources.join(","));
    }
    const response = await fetch(`${MCP_BASE_URL}/discovery/search?${searchParams.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({
            error: "Unknown MCP error",
            code: "UNKNOWN",
        }));
        throw new Error(`MCP search failed: ${error.error}`);
    }
    const data = await response.json();
    // Normalize the response to our DiscoveredBook format
    const books = (data.books || data.results || []).map((book) => ({
        id: String(book.id),
        title: book.title,
        authors: normalizeAuthors(book.authors),
        source: book.source,
        downloadUrl: book.downloadUrl || book.download_url,
        format: book.format,
        description: book.description,
        subjects: book.subjects,
        publishYear: book.publishYear || book.publish_year,
    }));
    return {
        books,
        totalFound: data.totalFound || data.total || books.length,
        query,
    };
}
async function pipelineTopic(params) {
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
        }));
        throw new Error(`MCP pipeline/topic failed: ${error.error}`);
    }
    const data = await response.json();
    const books = (data.books || data.results || []).map((book) => ({
        id: String(book.id),
        title: book.title,
        authors: normalizeAuthors(book.authors),
        source: book.source,
        downloadUrl: book.downloadUrl || book.download_url,
        format: book.format,
        description: book.description,
        subjects: book.subjects,
        publishYear: book.publishYear || book.publish_year,
    }));
    return {
        books,
        totalFound: data.totalFound || data.total || books.length,
        query,
    };
}
async function fetchAndParse(params) {
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
        }));
        return {
            success: false,
            title: "",
            authors: [],
            content: { summary: "", chapters: [] },
            error: error.error,
        };
    }
    const data = await response.json();
    return {
        success: true,
        title: data.title || "",
        authors: normalizeAuthors(data.authors),
        content: {
            summary: data.summary || data.content?.summary || "",
            chapters: (data.chapters || data.content?.chapters || []).map((ch, idx) => ({
                title: ch.title,
                content: ch.content,
                order: idx,
            })),
            totalPages: data.totalPages || data.content?.totalPages,
            wordCount: data.wordCount || data.content?.wordCount,
        },
    };
}
// ── Helper Functions ──────────────────────────────────────────────────────
function normalizeAuthors(authors) {
    if (!authors)
        return [];
    return authors.map((a) => (typeof a === "string" ? a : a.name));
}
