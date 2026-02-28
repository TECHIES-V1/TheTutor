"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const youtube_service_1 = require("./youtube.service");
(0, vitest_1.describe)("YouTube Service", () => {
    const originalFetch = global.fetch;
    const originalEnv = process.env;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        process.env = { ...originalEnv };
    });
    (0, vitest_1.afterEach)(() => {
        global.fetch = originalFetch;
        process.env = originalEnv;
    });
    (0, vitest_1.it)("should return null if YOUTUBE_API_KEY is not set", async () => {
        delete process.env.YOUTUBE_API_KEY;
        // We mock fetch to ensure it doesn't get called
        global.fetch = vitest_1.vi.fn();
        const result = await (0, youtube_service_1.searchYouTubeVideo)("React tutorial");
        (0, vitest_1.expect)(result).toBeNull();
        (0, vitest_1.expect)(global.fetch).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("should return video URL if search is successful", async () => {
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
        global.fetch = vitest_1.vi.fn().mockResolvedValue(mockResponse);
        const result = await (0, youtube_service_1.searchYouTubeVideo)("Rick Astley");
        (0, vitest_1.expect)(result).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        (0, vitest_1.expect)(global.fetch).toHaveBeenCalledTimes(1);
        // Check if the correct URL was built
        const callArg = global.fetch.mock.calls[0][0];
        const url = new URL(callArg);
        (0, vitest_1.expect)(url.searchParams.get("q")).toBe("Rick Astley");
        (0, vitest_1.expect)(url.searchParams.get("key")).toBe("dummy-api-key");
    });
    (0, vitest_1.it)("should return null if YouTube API returns error", async () => {
        process.env.YOUTUBE_API_KEY = "dummy-api-key";
        const mockResponse = {
            ok: false,
            status: 403,
            text: async () => "Forbidden",
        };
        global.fetch = vitest_1.vi.fn().mockResolvedValue(mockResponse);
        const result = await (0, youtube_service_1.searchYouTubeVideo)("will fail");
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)("should return multiple links for multiple queries", async () => {
        process.env.YOUTUBE_API_KEY = "dummy-api-key";
        // Mock sequence of responses
        global.fetch = vitest_1.vi.fn()
            .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: [{ id: { videoId: "video1" } }] }),
        })
            .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ items: [{ id: { videoId: "video2" } }] }),
        });
        const results = await (0, youtube_service_1.fetchVideoLinksForQueries)(["query 1", "query 2"]);
        (0, vitest_1.expect)(results).toEqual([
            "https://www.youtube.com/watch?v=video1",
            "https://www.youtube.com/watch?v=video2",
        ]);
        (0, vitest_1.expect)(global.fetch).toHaveBeenCalledTimes(2);
    });
});
