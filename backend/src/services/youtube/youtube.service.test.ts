import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchYouTubeVideo, fetchVideoLinksForQueries } from "./youtube.service";

describe("YouTube Service", () => {
    const originalFetch = global.fetch;
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetAllMocks();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        global.fetch = originalFetch;
        process.env = originalEnv;
    });

    it("should return null if YOUTUBE_API_KEY is not set", async () => {
        delete process.env.YOUTUBE_API_KEY;

        // We mock fetch to ensure it doesn't get called
        global.fetch = vi.fn();

        const result = await searchYouTubeVideo("React tutorial");
        expect(result).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should return video URL if search is successful", async () => {
        process.env.YOUTUBE_API_KEY = "dummy-api-key";

        const mockResponse = {
            ok: true,
            json: async () => ({
                items: [
                    {
                        id: {
                            videoId: "dQw4w9WgXcQ",
                        },
                    },
                ],
            }),
        };

        global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

        const result = await searchYouTubeVideo("Rick Astley");
        expect(result).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Check if the correct URL was built
        const callArg = (global.fetch as any).mock.calls[0][0];
        const url = new URL(callArg);
        expect(url.searchParams.get("q")).toBe("Rick Astley");
        expect(url.searchParams.get("key")).toBe("dummy-api-key");
    });

    it("should return null if YouTube API returns error", async () => {
        process.env.YOUTUBE_API_KEY = "dummy-api-key";

        const mockResponse = {
            ok: false,
            status: 403,
            text: async () => "Forbidden",
        };

        global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

        const result = await searchYouTubeVideo("will fail");
        expect(result).toBeNull();
    });

    it("should return multiple links for multiple queries", async () => {
        process.env.YOUTUBE_API_KEY = "dummy-api-key";

        // Mock sequence of responses
        global.fetch = vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [{ id: { videoId: "video1" } }] }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ items: [{ id: { videoId: "video2" } }] }),
            } as unknown as Response);

        const results = await fetchVideoLinksForQueries(["query 1", "query 2"]);
        expect(results).toEqual([
            "https://www.youtube.com/watch?v=video1",
            "https://www.youtube.com/watch?v=video2",
        ]);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
});
