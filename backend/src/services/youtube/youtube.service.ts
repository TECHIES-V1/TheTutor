import dotenv from "dotenv";

dotenv.config();

import { logger } from "../../config/logger";

export interface YouTubeVideoReference {
    url: string;
    title: string;
    channelName: string;
    queryUsed: string;
}

// ── Primary: YouTube Data API v3 (requires API key) ──────────────────────

async function searchWithDataApi(query: string, apiKey: string): Promise<YouTubeVideoReference | null> {
    try {
        const url = new URL("https://www.googleapis.com/youtube/v3/search");
        url.searchParams.append("part", "snippet");
        url.searchParams.append("maxResults", "1");
        url.searchParams.append("q", query);
        url.searchParams.append("type", "video");
        url.searchParams.append("key", apiKey);

        const response = await fetch(url.toString(), {
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            logger.error({ status: response.status, body: await response.text() }, "YouTube Data API error");
            return null;
        }

        const data = (await response.json()) as any;

        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            const videoId = item?.id?.videoId;
            if (videoId) {
                return {
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    title: String(item?.snippet?.title ?? ""),
                    channelName: String(item?.snippet?.channelTitle ?? ""),
                    queryUsed: query,
                };
            }
        }
    } catch (error) {
        logger.error({ err: error }, "YouTube Data API fetch failed");
    }

    return null;
}

// ── Fallback: Piped API (no API key needed) ──────────────────────────────

const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://pipedapi.in.projectsegfau.lt",
];

async function searchWithPiped(query: string): Promise<YouTubeVideoReference | null> {
    for (const instance of PIPED_INSTANCES) {
        try {
            const url = `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`;
            const response = await fetch(url, {
                signal: AbortSignal.timeout(8000),
            });

            if (!response.ok) continue;

            const data = (await response.json()) as any;
            const items = data.items ?? data;

            if (Array.isArray(items) && items.length > 0) {
                const item = items[0];
                const videoUrl = item.url ?? item.href ?? "";
                // Piped returns urls like "/watch?v=xxx"
                const videoId = videoUrl.match(/[?&]v=([^&]+)/)?.[1]
                    ?? videoUrl.replace(/^\/watch\?v=/, "");

                if (videoId && videoId.length > 5) {
                    return {
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        title: String(item.title ?? ""),
                        channelName: String(item.uploaderName ?? item.uploader ?? ""),
                        queryUsed: query,
                    };
                }
            }
        } catch {
            // Try next instance
        }
    }

    return null;
}

// ── Public API ───────────────────────────────────────────────────────────

export async function searchYouTubeVideo(query: string): Promise<YouTubeVideoReference | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;

    // Try YouTube Data API first if key is available
    if (apiKey) {
        const result = await searchWithDataApi(query, apiKey);
        if (result) return result;
        logger.warn({ query }, "YouTube Data API returned no results, trying Piped fallback");
    }

    // Fallback to Piped API (no key needed)
    const pipedResult = await searchWithPiped(query);
    if (pipedResult) return pipedResult;

    logger.warn({ query }, "All YouTube search methods failed");
    return null;
}

export async function fetchVideoLinksForQueries(queries: string[]): Promise<string[]> {
    const refs = await fetchVideoReferencesForQueries(queries);
    return refs.map((ref) => ref.url);
}

export async function fetchVideoReferencesForQueries(
    queries: string[]
): Promise<YouTubeVideoReference[]> {
    const references: YouTubeVideoReference[] = [];

    for (const query of queries) {
        const ref = await searchYouTubeVideo(query);
        if (ref) {
            references.push(ref);
        }
    }

    return references;
}
