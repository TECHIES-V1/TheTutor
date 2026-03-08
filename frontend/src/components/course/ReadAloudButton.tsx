"use client";

import { useRef } from "react";
import { Volume2, Pause, Play, Square, Loader2 } from "lucide-react";
import { useReadAloud, ReadAloudStatus } from "@/hooks/useReadAloud";
import { ReadAloudHighlighter } from "./ReadAloudHighlighter";

interface ReadAloudButtonProps {
  contentMarkdown: string;
  contentContainerRef: React.RefObject<HTMLElement | null>;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const;

export function ReadAloudButton({ contentMarkdown, contentContainerRef }: ReadAloudButtonProps) {
  const {
    status,
    play,
    pause,
    resume,
    stop,
    playbackRate,
    setPlaybackRate,
    progress,
    activeSectionText,
    sectionAnnouncement,
  } = useReadAloud(contentMarkdown);

  const panelRef = useRef<HTMLDivElement>(null);

  const isActive = status !== "idle";

  const handleFabClick = () => {
    switch (status) {
      case "idle":
        play();
        break;
      case "playing":
        pause();
        break;
      case "paused":
        resume();
        break;
      case "loading":
        // do nothing while loading
        break;
    }
  };

  const cycleSpeed = () => {
    const currentIdx = SPEED_OPTIONS.indexOf(playbackRate as typeof SPEED_OPTIONS[number]);
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
    setPlaybackRate(SPEED_OPTIONS[nextIdx]);
  };

  return (
    <>
      {/* Line highlighter — active when playing */}
      <ReadAloudHighlighter
        containerRef={contentContainerRef}
        activeSectionText={activeSectionText}
        active={status === "playing"}
      />

      <div className="fixed bottom-[5.5rem] right-6 z-[60]">
        {/* Control panel — shows when active */}
        {isActive && (
          <div
            ref={panelRef}
            className="absolute bottom-16 right-0 overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-2xl"
            style={{ width: 260 }}
          >
            {/* Section announcement */}
            {sectionAnnouncement && (
              <div className="border-b border-[var(--glass-border)] bg-primary/10 px-4 py-2">
                <p className="text-xs font-medium text-primary truncate">
                  {sectionAnnouncement}
                </p>
              </div>
            )}

            {/* Progress bar */}
            <div className="h-1 w-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={stop}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Stop"
              >
                <Square className="h-4 w-4" />
              </button>

              <button
                onClick={handleFabClick}
                className="skeuo-gold flex h-10 w-10 items-center justify-center rounded-full"
                title={status === "playing" ? "Pause" : "Resume"}
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === "playing" ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={cycleSpeed}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Change speed"
              >
                {playbackRate}x
              </button>
            </div>

            {/* Progress text */}
            <div className="border-t border-[var(--glass-border)] px-4 py-2">
              <p className="text-[11px] text-muted-foreground">
                Chunk {progress.current} of {progress.total}
              </p>
            </div>
          </div>
        )}

        {/* FAB */}
        <button
          onClick={handleFabClick}
          className="skeuo-gold flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
          title={fabTitle(status)}
        >
          <FabIcon status={status} />
        </button>
      </div>
    </>
  );
}

function FabIcon({ status }: { status: ReadAloudStatus }) {
  switch (status) {
    case "loading":
      return <Loader2 className="h-6 w-6 animate-spin" />;
    case "playing":
      return <Pause className="h-6 w-6" />;
    case "paused":
      return <Play className="h-6 w-6" />;
    default:
      return <Volume2 className="h-6 w-6" />;
  }
}

function fabTitle(status: ReadAloudStatus): string {
  switch (status) {
    case "loading":
      return "Loading audio...";
    case "playing":
      return "Pause read-aloud";
    case "paused":
      return "Resume read-aloud";
    default:
      return "Read aloud";
  }
}
