"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface UseAssistantTTSReturn {
  isSpeaking: boolean;
  autoSpeak: boolean;
  toggleAutoSpeak: () => void;
  speakResponse: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

const AUTO_SPEAK_KEY = "thetutor-auto-speak";

export function useAssistantTTS(): UseAssistantTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(AUTO_SPEAK_KEY) === "true";
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeak((prev) => {
      const next = !prev;
      localStorage.setItem(AUTO_SPEAK_KEY, String(next));
      return next;
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speakResponse = useCallback(async (text: string) => {
    // Clean markdown for speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "code block omitted")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .trim();

    if (!cleanText) return;

    // Limit to ~500 chars for TTS cost control
    const truncated = cleanText.length > 500 ? cleanText.slice(0, 497) + "..." : cleanText;

    stopSpeaking();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsSpeaking(true);

    try {
      const res = await fetch(`/api/proxy/tts/assistant-speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: truncated }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("TTS failed");
      const data = await res.json();

      if (controller.signal.aborted) return;

      // Decode base64 to audio
      const bytes = atob(data.audio);
      const buffer = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        buffer[i] = bytes.charCodeAt(i);
      }
      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      await new Promise<void>((resolve, reject) => {
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
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Assistant TTS error:", err);
      }
    } finally {
      setIsSpeaking(false);
      audioRef.current = null;
    }
  }, [stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      audioRef.current?.pause();
    };
  }, []);

  return {
    isSpeaking,
    autoSpeak,
    toggleAutoSpeak,
    speakResponse,
    stopSpeaking,
  };
}
