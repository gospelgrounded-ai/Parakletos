"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Mic, Pause, Play, Square, Trash2 } from "lucide-react";

type RecState = "idle" | "recording" | "stopped";

interface Props {
  onRecordingChange?: (blob: Blob | null) => void;
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Pick the best MIME type this browser/device supports
function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "",
  ];
  for (const t of candidates) {
    if (!t || MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export default function AudioRecorder({ onRecordingChange }: Props) {
  const [recState, setRecState] = useState<RecState>("idle");
  const [supported, setSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playError, setPlayError] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>("");
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "MediaRecorder" in window);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
    if (!stream) return;

    chunksRef.current = [];
    const mimeType = pickMimeType();
    mimeTypeRef.current = mimeType;

    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      // Use the recorder's actual mimeType (most reliable on iOS)
      const type = rec.mimeType || mimeTypeRef.current || "audio/mp4";
      const b = new Blob(chunksRef.current, { type });
      blobRef.current = b;
      const url = URL.createObjectURL(b);
      audioUrlRef.current = url;
      setAudioUrl(url);
      setPlayError(false);
      onRecordingChange?.(b);
      setRecState("stopped");
    };

    rec.start();
    recorderRef.current = rec;
    setElapsed(0);
    setRecState("recording");
    timerRef.current = setInterval(() => setElapsed((n) => n + 1), 1000);
  }

  function stop() {
    clearTimer();
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  function resetAudio() {
    audioRef.current?.pause();
    audioRef.current = null;
    const url = audioUrlRef.current;
    if (url) URL.revokeObjectURL(url);
    audioUrlRef.current = null;
    setAudioUrl(null);
    blobRef.current = null;
    setElapsed(0);
    setIsPlaying(false);
    setPlayError(false);
  }

  function discard() {
    resetAudio();
    setRecState("idle");
    onRecordingChange?.(null);
  }

  function togglePlay() {
    if (!audioUrlRef.current) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrlRef.current);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        setPlayError(true);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setPlayError(false);
      const p = audioRef.current.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
          setPlayError(true);
        });
      } else {
        setIsPlaying(true);
      }
    }
  }

  function download() {
    const url = audioUrlRef.current;
    if (!url) return;
    const ext = (rec: string) =>
      rec.includes("mp4") ? "mp4" : rec.includes("ogg") ? "ogg" : "webm";
    const a = document.createElement("a");
    a.href = url;
    a.download = `sermon-audio.${ext(mimeTypeRef.current)}`;
    a.click();
  }

  useEffect(() => {
    return () => {
      clearTimer();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      const url = audioUrlRef.current;
      if (url) URL.revokeObjectURL(url);
    };
  }, [clearTimer]);

  if (!supported) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-muted/30">
      {recState === "idle" && (
        <Button size="sm" variant="outline" onClick={start} className="gap-2">
          <Mic className="h-4 w-4 text-rose-500" />
          Record Sermon
        </Button>
      )}

      {recState === "recording" && (
        <>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <span className="text-sm font-mono tabular-nums text-rose-500">{fmt(elapsed)}</span>
          <Button size="sm" variant="outline" onClick={stop} className="gap-2">
            <Square className="h-3 w-3 fill-current" />
            Stop
          </Button>
        </>
      )}

      {recState === "stopped" && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">{fmt(elapsed)}</span>
          {playError && (
            <span className="text-xs text-destructive">Playback failed</span>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={download}
            aria-label="Download recording"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={discard}
            aria-label="Discard recording"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              resetAudio();
              setRecState("idle");
              await start();
            }}
            className="gap-2 ml-auto"
          >
            <Mic className="h-4 w-4 text-rose-500" />
            Re-record
          </Button>
        </>
      )}
    </div>
  );
}
