"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

type TtsMode = "detecting" | "api" | "browser";

interface VoiceOption {
  id: string;
  name: string;
}

const browserSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AudioPlayerProps {
  verses: Array<{ verse: number; text: string }>;
  bookName: string;
  chapter: number;
  isAuthenticated?: boolean;
  onReadingVerseChange: (verse: number | null) => void;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AudioPlayer({
  verses,
  bookName,
  chapter,
  isAuthenticated = false,
  onReadingVerseChange,
  onClose,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [ttsMode, setTtsMode] = useState<TtsMode>(
    isAuthenticated ? "detecting" : "browser"
  );
  const [apiVoices, setApiVoices] = useState<VoiceOption[]>([]);
  const [selectedApiVoice, setSelectedApiVoice] = useState("");
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState("");
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Stable mutable refs — used inside async callbacks to avoid stale closures
  const isPlayingRef = useRef(false);
  const currentIdxRef = useRef(0);
  const speedRef = useRef<Speed>(1);
  const ttsModeRef = useRef<TtsMode>(isAuthenticated ? "detecting" : "browser");
  const apiVoiceRef = useRef("");
  const browserVoiceRef = useRef("");

  // Audio element refs
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // "Latest play function" ref — lets onended/onend call the current version
  // without capturing a stale closure.
  const playVerseRef = useRef<(idx: number) => void>(() => {});

  // ─── Fetch API voices on mount ────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/audio/tts/voices")
      .then((r) => r.json())
      .then((data: { service: string | null; voices: VoiceOption[]; defaultVoice: string }) => {
        if (data.service && data.voices.length > 0) {
          setApiVoices(data.voices);
          setSelectedApiVoice(data.defaultVoice);
          apiVoiceRef.current = data.defaultVoice;
          ttsModeRef.current = "api";
          setTtsMode("api");
        } else {
          // No API key configured — fall back to browser TTS
          ttsModeRef.current = "browser";
          setTtsMode("browser");
        }
      })
      .catch(() => {
        ttsModeRef.current = "browser";
        setTtsMode("browser");
      });
  }, [isAuthenticated]);

  // ─── Browser voice loading ─────────────────────────────────────────────────

  useEffect(() => {
    if (!browserSupported) return;
    function load() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const en = voices.filter((v) => v.lang.startsWith("en"));
      const list = en.length > 0 ? en : voices;
      setBrowserVoices(list);
      if (!browserVoiceRef.current) {
        const preferred =
          list.find(
            (v) =>
              v.name.includes("Samantha") ||
              v.name.includes("Karen") ||
              v.name.includes("Daniel") ||
              v.name.includes("Zira") ||
              v.default
          ) ?? list[0];
        setSelectedBrowserVoice(preferred.voiceURI);
        browserVoiceRef.current = preferred.voiceURI;
      }
    }
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopAll();
      onReadingVerseChange(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReadingVerseChange]);

  // Chrome bug: SpeechSynthesis silently stops after ~15 s.
  useEffect(() => {
    if (ttsMode !== "browser" || !isPlaying || !browserSupported) return;
    const id = setInterval(() => {
      if (
        window.speechSynthesis.speaking &&
        !window.speechSynthesis.paused
      ) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10_000);
    return () => clearInterval(id);
  }, [isPlaying, ttsMode]);

  // ─── Stop helpers ─────────────────────────────────────────────────────────

  function stopAll() {
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
      audioElRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (browserSupported) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsLoadingAudio(false);
  }

  // ─── API TTS playback (ElevenLabs or OpenAI) ─────────────────────────────

  function playVerseApi(idx: number) {
    if (idx >= verses.length) {
      stopAll();
      setCurrentIdx(0);
      currentIdxRef.current = 0;
      onReadingVerseChange(null);
      return;
    }

    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
      audioElRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    currentIdxRef.current = idx;
    setCurrentIdx(idx);
    onReadingVerseChange(verses[idx].verse);
    document
      .getElementById(`v${verses[idx].verse}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

    setIsLoadingAudio(true);

    fetch("/api/audio/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: stripHtml(verses[idx].text),
        voice: apiVoiceRef.current,
      }),
    })
      .then(async (res) => {
        if (res.status === 503) {
          // No API key — fall back to browser TTS
          ttsModeRef.current = "browser";
          setTtsMode("browser");
          setIsLoadingAudio(false);
          if (isPlayingRef.current) playVerseBrowser(idx);
          return;
        }
        if (!res.ok) {
          console.error("TTS error:", res.status);
          setIsLoadingAudio(false);
          stopAll();
          return;
        }

        if (ttsModeRef.current === "detecting") {
          ttsModeRef.current = "api";
          setTtsMode("api");
        }

        if (!isPlayingRef.current) {
          setIsLoadingAudio(false);
          return;
        }

        const buf = await res.arrayBuffer();
        const url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
        blobUrlRef.current = url;

        const audio = new Audio(url);
        audio.playbackRate = speedRef.current;
        audioElRef.current = audio;
        setIsLoadingAudio(false);

        audio.onended = () => {
          if (audioElRef.current !== audio) return;
          URL.revokeObjectURL(url);
          blobUrlRef.current = null;
          audioElRef.current = null;
          if (isPlayingRef.current) playVerseRef.current(idx + 1);
        };
        audio.onerror = () => {
          if (audioElRef.current !== audio) return;
          stopAll();
        };

        audio.play().catch(() => stopAll());
      })
      .catch(() => {
        setIsLoadingAudio(false);
        stopAll();
      });
  }

  // ─── Browser TTS playback ─────────────────────────────────────────────────

  function playVerseBrowser(idx: number) {
    if (!browserSupported) return;
    if (idx >= verses.length) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      isPlayingRef.current = false;
      setIsPlaying(false);
      setCurrentIdx(0);
      currentIdxRef.current = 0;
      onReadingVerseChange(null);
      return;
    }

    window.speechSynthesis.cancel();
    currentIdxRef.current = idx;
    setCurrentIdx(idx);
    onReadingVerseChange(verses[idx].verse);
    document
      .getElementById(`v${verses[idx].verse}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

    const utterance = new SpeechSynthesisUtterance(stripHtml(verses[idx].text));
    utterance.rate = speedRef.current;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.voiceURI === browserVoiceRef.current);
    if (voice) utterance.voice = voice;

    utteranceRef.current = utterance;

    utterance.onend = () => {
      if (utteranceRef.current !== utterance) return;
      if (isPlayingRef.current) playVerseRef.current(idx + 1);
    };
    utterance.onerror = (e) => {
      if (e.error === "canceled") return;
      if (utteranceRef.current !== utterance) return;
      isPlayingRef.current = false;
      setIsPlaying(false);
      utteranceRef.current = null;
      onReadingVerseChange(null);
    };

    window.speechSynthesis.speak(utterance);
  }

  // Keep the ref pointing at the current play function each render
  playVerseRef.current =
    ttsModeRef.current === "browser" ? playVerseBrowser : playVerseApi;

  // ─── Control handlers ─────────────────────────────────────────────────────

  function playVerse(idx: number) {
    if (ttsModeRef.current === "browser") playVerseBrowser(idx);
    else playVerseApi(idx);
  }

  function handlePlayPause() {
    if (isPlayingRef.current) {
      stopAll();
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      playVerse(currentIdxRef.current);
    }
  }

  function handlePrev() {
    const idx = Math.max(0, currentIdxRef.current - 1);
    if (isPlayingRef.current) {
      playVerse(idx);
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
      playVerse(idx);
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
    if (audioElRef.current) audioElRef.current.playbackRate = s;
    if (ttsModeRef.current === "browser" && isPlayingRef.current) {
      playVerseBrowser(currentIdxRef.current);
    }
  }

  function handleApiVoice(v: string) {
    apiVoiceRef.current = v;
    setSelectedApiVoice(v);
    if (isPlayingRef.current && ttsModeRef.current !== "browser") {
      playVerseApi(currentIdxRef.current);
    }
  }

  function handleBrowserVoice(uri: string) {
    browserVoiceRef.current = uri;
    setSelectedBrowserVoice(uri);
    if (isPlayingRef.current && ttsModeRef.current === "browser") {
      playVerseBrowser(currentIdxRef.current);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const currentVerse = verses[currentIdx];
  const canPlay = ttsMode === "api" || ttsMode === "detecting" || browserSupported;
  const showApiVoices = isAuthenticated && ttsMode !== "browser" && apiVoices.length > 0;
  const showBrowserVoices = ttsMode === "browser" && browserVoices.length > 1;

  return (
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur-sm shadow-lg md:left-16 lg:left-[220px]">
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
            {isLoadingAudio
              ? "Loading…"
              : `Verse ${currentVerse?.verse} of ${verses.length}`}
          </p>
        </div>

        {/* Prev · Play/Pause · Next */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handlePrev}
            disabled={isLoadingAudio}
            aria-label="Previous verse"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="sm"
            className="h-9 w-9 p-0 rounded-full"
            onClick={handlePlayPause}
            disabled={!canPlay || isLoadingAudio}
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
            disabled={isLoadingAudio}
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
                "text-[10px] font-mono px-1 py-0.5 rounded transition-colors",
                speed === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Voice selector */}
        {showApiVoices && (
          <select
            value={selectedApiVoice}
            onChange={(e) => handleApiVoice(e.target.value)}
            className="text-xs rounded px-1.5 py-0.5 bg-muted border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer max-w-[100px] shrink-0"
            aria-label="Voice"
          >
            {apiVoices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}
        {showBrowserVoices && (
          <select
            value={selectedBrowserVoice}
            onChange={(e) => handleBrowserVoice(e.target.value)}
            className="text-xs rounded px-1.5 py-0.5 bg-muted border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer max-w-[90px] shrink-0"
            aria-label="Voice"
          >
            {browserVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name.replace(/\(.*?\)/g, "").trim()}
              </option>
            ))}
          </select>
        )}

        {/* Close */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 shrink-0"
          onClick={() => {
            stopAll();
            onClose();
          }}
          aria-label="Close audio player"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!canPlay && (
        <p className="text-center text-xs text-muted-foreground pb-2">
          Text-to-speech is not supported in this browser.
        </p>
      )}
    </div>
  );
}
