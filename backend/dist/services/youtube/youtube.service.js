"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchYouTubeVideo = searchYouTubeVideo;
exports.fetchVideoLinksForQueries = fetchVideoLinksForQueries;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function searchYouTubeVideo(query) {
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
        const data = (await response.json());
        if (data.items && data.items.length > 0) {
            const videoId = data.items[0].id.videoId;
            if (videoId) {
                return `https://www.youtube.com/watch?v=${videoId}`;
            }
        }
    }
    catch (error) {
        console.error("Failed to search YouTube:", error);
    }
    return null;
}
async function fetchVideoLinksForQueries(queries) {
    const links = [];
    for (const query of queries) {
        const link = await searchYouTubeVideo(query);
        if (link) {
            links.push(link);
        }
    }
    return links;
}
