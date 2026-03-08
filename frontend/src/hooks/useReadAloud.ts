"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { BACKEND_URL } from "@/lib/backendUrl";

interface TextChunk {
  index: number;
  plainText: string;
  startOffset: number;
  endOffset: number;
  sectionHeading: string | null;
  wordOffset: number;
}

interface SpeechMark {
  time: number;
  type: "word" | "sentence";
  start: number;
  end: number;
  value: string;
}

interface ChunkAudio {
  audio: string; // base64
  marks: SpeechMark[];
  chunkIndex: number;
}

export type ReadAloudStatus = "idle" | "loading" | "playing" | "paused";

export interface UseReadAloudReturn {
  status: ReadAloudStatus;
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  progress: { current: number; total: number; percent: number };
  highlightWordIndex: number | null;
  sectionAnnouncement: string | null;
}

export function useReadAloud(contentMarkdown: string): UseReadAloudReturn {
  const [status, setStatus] = useState<ReadAloudStatus>("idle");
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [highlightWordIndex, setHighlightWordIndex] = useState<number | null>(null);
  const [sectionAnnouncement, setSectionAnnouncement] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const marksRef = useRef<SpeechMark[]>([]);
  const chunksRef = useRef<TextChunk[]>([]);
  const currentChunkRef = useRef(0);
  const rafRef = useRef<number>(0);
  const prefetchedRef = useRef<Map<number, ChunkAudio>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const lastWordIdxRef = useRef<number | null>(null);

  // Keep refs in sync
  useEffect(() => {
    chunksRef.current = chunks;
  }, [chunks]);
  useEffect(() => {
    currentChunkRef.current = currentChunkIndex;
  }, [currentChunkIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
      abortRef.current?.abort();
    };
  }, []);

  const fetchChunks = useCallback(async (signal: AbortSignal): Promise<TextChunk[]> => {
    const res = await fetch(`${BACKEND_URL}/tts/chunk`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: contentMarkdown }),
      signal,
    });
    if (!res.ok) throw new Error("Failed to chunk markdown");
    const data = await res.json();
    return data.chunks;
  }, [contentMarkdown]);

  const fetchChunkAudio = useCallback(async (chunk: TextChunk, signal: AbortSignal): Promise<ChunkAudio> => {
    const res = await fetch(`${BACKEND_URL}/tts/synthesize`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: chunk.plainText, chunkIndex: chunk.index }),
      signal,
    });
    if (!res.ok) throw new Error("Failed to synthesize chunk");
    return res.json();
  }, []);

  const startHighlightLoop = useCallback(() => {
    const tick = () => {
      const audio = audioRef.current;
      const marks = marksRef.current;
      if (!audio || marks.length === 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const currentMs = audio.currentTime * 1000;
      let activeWordIdx: number | null = null;
      const chunk = chunksRef.current[currentChunkRef.current];

      for (let i = marks.length - 1; i >= 0; i--) {
        if (marks[i].type === "word" && currentMs >= marks[i].time) {
          activeWordIdx = (chunk?.wordOffset ?? 0) + i;
          break;
        }
      }

      if (activeWordIdx !== lastWordIdxRef.current) {
        lastWordIdxRef.current = activeWordIdx;
        setHighlightWordIndex(activeWordIdx);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const playChunkAudio = useCallback(async (chunkAudio: ChunkAudio, chunk: TextChunk) => {
    // Announce section if new heading
    if (chunk.sectionHeading) {
      setSectionAnnouncement(chunk.sectionHeading);
      // Use browser speech for announcement (free)
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(`Now reading: ${chunk.sectionHeading}`);
        utterance.rate = 1.1;
        await new Promise<void>((resolve) => {
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        });
      }
      // Clear announcement after a delay
      setTimeout(() => setSectionAnnouncement(null), 3000);
    }

    marksRef.current = chunkAudio.marks;

    // Create audio from base64
    const blob = base64ToBlob(chunkAudio.audio, "audio/mpeg");
    const url = URL.createObjectURL(blob);

    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
    }

    const audio = new Audio(url);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;

    // Prefetch next chunk
    const nextIdx = chunk.index + 1;
    if (nextIdx < chunksRef.current.length && !prefetchedRef.current.has(nextIdx)) {
      const nextChunk = chunksRef.current[nextIdx];
      fetchChunkAudio(nextChunk, abortRef.current?.signal ?? new AbortController().signal)
        .then((data) => prefetchedRef.current.set(nextIdx, data))
        .catch(() => {}); // non-critical
    }

    return new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Audio playback error"));
      };
      audio.play().catch(reject);
    });
  }, [playbackRate, fetchChunkAudio]);

  const playAllChunks = useCallback(async (startIndex: number, chunkList: TextChunk[]) => {
    startHighlightLoop();

    for (let i = startIndex; i < chunkList.length; i++) {
      if (abortRef.current?.signal.aborted) break;

      setCurrentChunkIndex(i);
      currentChunkRef.current = i;

      // Get audio (from prefetch cache or fetch)
      let chunkAudio = prefetchedRef.current.get(i);
      if (!chunkAudio) {
        chunkAudio = await fetchChunkAudio(chunkList[i], abortRef.current!.signal);
        prefetchedRef.current.set(i, chunkAudio);
      }

      await playChunkAudio(chunkAudio, chunkList[i]);
      prefetchedRef.current.delete(i);
    }

    // Done playing all chunks
    cancelAnimationFrame(rafRef.current);
    lastWordIdxRef.current = null;
    setHighlightWordIndex(null);
    setSectionAnnouncement(null);
    setStatus("idle");
  }, [startHighlightLoop, fetchChunkAudio, playChunkAudio]);

  const play = useCallback(async () => {
    if (status === "playing") return;

    setStatus("loading");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    prefetchedRef.current.clear();

    try {
      const fetchedChunks = await fetchChunks(controller.signal);
      if (fetchedChunks.length === 0) {
        setStatus("idle");
        return;
      }

      setChunks(fetchedChunks);
      chunksRef.current = fetchedChunks;
      setCurrentChunkIndex(0);
      setStatus("playing");

      await playAllChunks(0, fetchedChunks);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Read-aloud error:", err);
      }
      setStatus("idle");
    }
  }, [status, fetchChunks, playAllChunks]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    cancelAnimationFrame(rafRef.current);
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    audioRef.current?.play();
    startHighlightLoop();
    setStatus("playing");
  }, [status, startHighlightLoop]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    audioRef.current?.pause();
    cancelAnimationFrame(rafRef.current);
    lastWordIdxRef.current = null;
    setHighlightWordIndex(null);
    setSectionAnnouncement(null);
    setCurrentChunkIndex(0);
    setStatus("idle");
    prefetchedRef.current.clear();
    window.speechSynthesis?.cancel();
  }, []);

  // Update playback rate on existing audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const total = chunks.length || 1;
  const progress = {
    current: currentChunkIndex + 1,
    total: chunks.length,
    percent: chunks.length > 0 ? Math.round(((currentChunkIndex + 1) / total) * 100) : 0,
  };

  return {
    status,
    play,
    pause,
    resume,
    stop,
    playbackRate,
    setPlaybackRate,
    progress,
    highlightWordIndex,
    sectionAnnouncement,
  };
}

function base64ToBlob(base64: string, mime: string): Blob {
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    buffer[i] = bytes.charCodeAt(i);
  }
  return new Blob([buffer], { type: mime });
}
