import dotenv from "dotenv";

dotenv.config();

export interface YouTubeVideoReference {
    url: string;
    title: string;
    channelName: string;
    queryUsed: string;
}

export async function searchYouTubeVideo(query: string): Promise<YouTubeVideoReference | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.warn("YOUTUBE_API_KEY is not set. Skipping YouTube search.");
        return null;
    }

    try {
        const url = new URL("https://www.googleapis.com/youtube/v3/search");
        url.searchParams.append("part", "snippet");
        url.searchParams.append("maxResults", "1");
        url.searchParams.append("q", query);
        url.searchParams.append("type", "video");
        url.searchParams.append("key", apiKey);

        const response = await fetch(url.toString());

        if (!response.ok) {
            console.error("YouTube API responded with error:", response.status, await response.text());
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
        console.error("Failed to search YouTube:", error);
    }

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
