"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  verses: Array<{ verse: number; text: string }>;
  bookName: string;
  chapter: number;
  onReadingVerseChange: (verse: number | null) => void;
  onClose: () => void;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const supported =
  typeof window !== "undefined" && "speechSynthesis" in window;

export default function AudioPlayer({
  verses,
  bookName,
  chapter,
  onReadingVerseChange,
  onClose,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);

  const speedRef = useRef<Speed>(1);
  const isPlayingRef = useRef(false);
  const currentIdxRef = useRef(0);
  // Track the active utterance so stale onend/onerror callbacks can be ignored
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speakVerse = useCallback(
    (idx: number) => {
      if (!supported) return;

      if (idx >= verses.length) {
        window.speechSynthesis.cancel();
        activeUtteranceRef.current = null;
        isPlayingRef.current = false;
        setIsPlaying(false);
        setCurrentIdx(0);
        currentIdxRef.current = 0;
        onReadingVerseChange(null);
        return;
      }

      // Cancel current utterance — this fires onerror('canceled') on the old one,
      // which we intentionally ignore via the stale-ref check below.
      window.speechSynthesis.cancel();

      currentIdxRef.current = idx;
      setCurrentIdx(idx);
      onReadingVerseChange(verses[idx].verse);

      document
        .getElementById(`v${verses[idx].verse}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });

      const utterance = new SpeechSynthesisUtterance(stripHtml(verses[idx].text));
      utterance.rate = speedRef.current;
      activeUtteranceRef.current = utterance;

      utterance.onend = () => {
        // Ignore if a newer utterance has taken over
        if (activeUtteranceRef.current !== utterance) return;
        if (isPlayingRef.current) speakVerse(idx + 1);
      };

      utterance.onerror = (e) => {
        // 'canceled' means we called cancel() intentionally — not a real error
        if (e.error === "canceled") return;
        if (activeUtteranceRef.current !== utterance) return;
        isPlayingRef.current = false;
        setIsPlaying(false);
        activeUtteranceRef.current = null;
        onReadingVerseChange(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [verses, onReadingVerseChange]
  );

  // Chrome bug: SpeechSynthesis silently stops after ~15 s without user interaction.
  // Periodically pause+resume to keep it alive.
  useEffect(() => {
    if (!isPlaying || !supported) return;
    const id = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
      onReadingVerseChange(null);
    };
  }, [onReadingVerseChange]);

  function handlePlayPause() {
    if (!supported) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
      isPlayingRef.current = false;
      setIsPlaying(false);
      onReadingVerseChange(null);
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      speakVerse(currentIdxRef.current);
    }
  }

  function handlePrev() {
    const idx = Math.max(0, currentIdxRef.current - 1);
    if (isPlayingRef.current) {
      speakVerse(idx);
    } else {
      currentIdxRef.current = idx;
      setCurrentIdx(idx);
      onReadingVerseChange(verses[idx].verse);
      document
        .getElementById(`v${verses[idx].verse}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function handleNext() {
    const idx = Math.min(verses.length - 1, currentIdxRef.current + 1);
    if (isPlayingRef.current) {
      speakVerse(idx);
    } else {
      currentIdxRef.current = idx;
      setCurrentIdx(idx);
      onReadingVerseChange(verses[idx].verse);
      document
        .getElementById(`v${verses[idx].verse}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function handleSpeed(s: Speed) {
    speedRef.current = s;
    setSpeed(s);
    if (isPlayingRef.current) speakVerse(currentIdxRef.current);
  }

  const currentVerse = verses[currentIdx];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur-sm shadow-lg md:left-16 lg:left-[220px]">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Status icon */}
        <Volume2
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isPlaying ? "text-primary" : "text-muted-foreground"
          )}
        />

        {/* Verse info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground leading-none">
            {bookName} {chapter}
          </p>
          <p className="text-sm font-medium leading-tight mt-0.5">
            Verse {currentVerse?.verse} of {verses.length}
          </p>
        </div>

        {/* Prev · Play/Pause · Next */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handlePrev}
            aria-label="Previous verse"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="sm"
            className="h-9 w-9 p-0 rounded-full"
            onClick={handlePlayPause}
            disabled={!supported}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleNext}
            aria-label="Next verse"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-0.5 shrink-0">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeed(s)}
              className={cn(
                "text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded transition-colors",
                speed === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Close */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 shrink-0"
          onClick={() => {
            if (supported) window.speechSynthesis.cancel();
            onClose();
          }}
          aria-label="Close audio player"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!supported && (
        <p className="text-center text-xs text-muted-foreground pb-2">
          Text-to-speech is not supported in this browser.
        </p>
      )}
    </div>
  );
}
