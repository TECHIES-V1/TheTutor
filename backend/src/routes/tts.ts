import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { pollyLimiter } from "../middleware/rateLimiter";
import { chunkMarkdown, synthesizeWithMarks, synthesizeChunk } from "../services/polly/pollyService";
import { logger } from "../config/logger";

const router = Router();

/**
 * POST /tts/chunk
 * Parse markdown into Polly-sized chunks with section headings and word offsets.
 */
router.post("/chunk", requireAuth, pollyLimiter, async (req: Request, res: Response) => {
  try {
    const markdown = String(req.body?.markdown ?? "");
    if (!markdown.trim()) {
      res.status(400).json({ error: "markdown is required" });
      return;
    }

    const chunks = chunkMarkdown(markdown);
    res.json({ chunks });
  } catch (err) {
    logger.error({ err }, "Failed to chunk markdown for TTS");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /tts/synthesize
 * Synthesize a single text chunk into audio + speech marks.
 */
router.post("/synthesize", requireAuth, pollyLimiter, async (req: Request, res: Response) => {
  try {
    const text = String(req.body?.text ?? "");
    const chunkIndex = Number(req.body?.chunkIndex ?? 0);

    if (!text.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    if (text.length > 3000) {
      res.status(400).json({ error: "text exceeds 3000 character limit" });
      return;
    }

    const { audio, marks } = await synthesizeWithMarks(text);

    res.json({
      audio: audio.toString("base64"),
      marks,
      chunkIndex,
    });
  } catch (err) {
    logger.error({ err }, "Failed to synthesize speech");
    res.status(500).json({ error: "Speech synthesis failed" });
  }
});

/**
 * POST /tts/assistant-speak
 * Synthesize a short AI assistant response (no speech marks needed).
 */
router.post("/assistant-speak", requireAuth, pollyLimiter, async (req: Request, res: Response) => {
  try {
    const text = String(req.body?.text ?? "");
    if (!text.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    // For longer responses, truncate to Polly's limit
    const truncated = text.slice(0, 3000);
    const audio = await synthesizeChunk(truncated);

    res.json({
      audio: audio.toString("base64"),
    });
  } catch (err) {
    logger.error({ err }, "Failed to synthesize assistant speech");
    res.status(500).json({ error: "Speech synthesis failed" });
  }
});

export default router;
