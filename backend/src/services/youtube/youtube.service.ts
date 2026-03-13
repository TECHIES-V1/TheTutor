import dotenv from "dotenv";

dotenv.config();

import { logger } from "../../config/logger";

export interface YouTubeVideoReference {
    url: string;
    title: string;
    channelName: string;
    queryUsed: string;
}

// ── Multi-key quota management ──────────────────────────────────────────────

interface KeyState {
    key: string;
    exhausted: boolean;
    exhaustedAt: number;
}

const QUOTA_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function parseApiKeys(): KeyState[] {
    const multi = process.env.YOUTUBE_API_KEYS?.split(",").map(k => k.trim()).filter(Boolean);
    const single = process.env.YOUTUBE_API_KEY?.trim();
    const keys = multi?.length ? multi : single ? [single] : [];
    return keys.map(key => ({ key, exhausted: false, exhaustedAt: 0 }));
}

const apiKeys: KeyState[] = parseApiKeys();
let currentKeyIndex = 0;

function getNextAvailableKey(): string | null {
    if (apiKeys.length === 0) return null;

    const now = Date.now();
    for (const ks of apiKeys) {
        if (ks.exhausted && now - ks.exhaustedAt > QUOTA_COOLDOWN_MS) {
            ks.exhausted = false;
        }
    }

    for (let i = 0; i < apiKeys.length; i++) {
        const idx = (currentKeyIndex + i) % apiKeys.length;
        if (!apiKeys[idx].exhausted) {
            currentKeyIndex = (idx + 1) % apiKeys.length;
            return apiKeys[idx].key;
        }
    }

    return null; // all exhausted
}

function markKeyExhausted(key: string): void {
    const ks = apiKeys.find(k => k.key === key);
    if (!ks) return;
    ks.exhausted = true;
    ks.exhaustedAt = Date.now();
    const idx = apiKeys.indexOf(ks);
    const available = apiKeys.filter(k => !k.exhausted).length;
    logger.warn(
        { keyIndex: idx, totalKeys: apiKeys.length, availableKeys: available },
        "YouTube API key quota exhausted, rotating to next"
    );
}

// ── Primary: YouTube Data API v3 (requires API key) ──────────────────────

async function searchWithDataApi(query: string, apiKey: string): Promise<{ result: YouTubeVideoReference | null; quotaExceeded: boolean }> {
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
            const body = await response.text();
            logger.error({ status: response.status, body }, "YouTube Data API error");
            if (response.status === 403 && (body.includes("quotaExceeded") || body.includes("dailyLimitExceeded") || body.includes("rateLimitExceeded"))) {
                return { result: null, quotaExceeded: true };
            }
            return { result: null, quotaExceeded: false };
        }

        const data = (await response.json()) as any;

        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            const videoId = item?.id?.videoId;
            if (videoId) {
                return {
                    result: {
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        title: String(item?.snippet?.title ?? ""),
                        channelName: String(item?.snippet?.channelTitle ?? ""),
                        queryUsed: query,
                    },
                    quotaExceeded: false,
                };
            }
        }
    } catch (error) {
        logger.error({ err: error }, "YouTube Data API fetch failed");
    }

    return { result: null, quotaExceeded: false };
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
    // Try YouTube Data API with key rotation
    let attempts = 0;
    while (attempts < apiKeys.length) {
        const key = getNextAvailableKey();
        if (!key) break; // all keys exhausted

        const { result, quotaExceeded } = await searchWithDataApi(query, key);

        if (quotaExceeded) {
            markKeyExhausted(key);
            attempts++;
            continue;
        }

        if (result) return result;

        // API returned no results (not a quota issue) — don't retry with different key
        logger.warn({ query }, "YouTube Data API returned no results, trying Piped fallback");
        break;
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
