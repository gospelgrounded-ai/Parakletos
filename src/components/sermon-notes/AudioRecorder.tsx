"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Flag, Mic, Square, Trash2 } from "lucide-react";
import {
  deleteRecording,
  getRecording,
  putRecording,
} from "@/lib/audio-store";
import { type Stamp } from "@/lib/timestamps";

type RecState = "idle" | "recording" | "stopped";

interface Props {
  /** Persist/restore the recording on this device, keyed by note id. */
  noteId?: string;
  /** Called with the elapsed seconds when the user taps Stamp while recording. */
  onStamp?: (seconds: number) => void;
  /** Timestamp markers parsed from the note text — rendered as jump chips. */
  stamps?: Stamp[];
}

function fmt(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
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

export default function AudioRecorder({ noteId, onStamp, stamps = [] }: Props) {
  const [recState, setRecState] = useState<RecState>("idle");
  const [supported, setSupported] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mimeTypeRef = useRef<string>("");
  const audioUrlRef = useRef<string | null>(null);
  const elapsedRef = useRef(0);
  const restoreRanRef = useRef(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "MediaRecorder" in window);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Restore a previous recording for this note from this device.
  // Guarded so StrictMode's double-run doesn't create two object URLs.
  useEffect(() => {
    if (!noteId || restoreRanRef.current) return;
    restoreRanRef.current = true;
    let cancelled = false;
    getRecording(noteId).then((stored) => {
      if (cancelled || !stored) return;
      // A live recording in progress wins over the stored one
      if (recorderRef.current) return;
      blobRef.current = stored.blob;
      mimeTypeRef.current = stored.mimeType;
      elapsedRef.current = stored.duration;
      const url = URL.createObjectURL(stored.blob);
      audioUrlRef.current = url;
      setAudioUrl(url);
      setElapsed(stored.duration);
      setPersisted(true);
      setRecState("stopped");
    });
    return () => {
      cancelled = true;
    };
  }, [noteId]);

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
      setDownloaded(false);
      setRecState("stopped");

      if (noteId) {
        void putRecording(noteId, {
          blob: b,
          mimeType: type,
          duration: elapsedRef.current,
          createdAt: Date.now(),
        }).then(setPersisted);
      }
    };

    rec.start();
    recorderRef.current = rec;
    elapsedRef.current = 0;
    setElapsed(0);
    setPersisted(false);
    setRecState("recording");
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
  }

  function stop() {
    clearTimer();
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  function resetAudio() {
    audioElRef.current?.pause();
    const url = audioUrlRef.current;
    if (url) URL.revokeObjectURL(url);
    audioUrlRef.current = null;
    setAudioUrl(null);
    blobRef.current = null;
    elapsedRef.current = 0;
    setElapsed(0);
    setPersisted(false);
    setDownloaded(false);
  }

  function discard() {
    resetAudio();
    setRecState("idle");
    if (noteId) void deleteRecording(noteId);
  }

  function jumpTo(seconds: number) {
    const el = audioElRef.current;
    if (!el) return;
    el.currentTime = seconds;
    void el.play().catch(() => {});
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
    setDownloaded(true);
  }

  useEffect(() => {
    return () => {
      clearTimer();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      const url = audioUrlRef.current;
      if (url) URL.revokeObjectURL(url);
    };
  }, [clearTimer]);

  // If the recording couldn't be persisted anywhere, warn before a hard exit
  const atRisk = recState === "stopped" && !persisted && !downloaded;
  useEffect(() => {
    if (!atRisk) return;
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [atRisk]);

  if (!supported) return null;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
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
            {onStamp && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onStamp(elapsedRef.current)}
                className="gap-1.5"
                title="Insert a timestamp marker into your notes"
              >
                <Flag className="h-3.5 w-3.5" />
                Stamp
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={stop} className="gap-2">
              <Square className="h-3 w-3 fill-current" />
              Stop
            </Button>
          </>
        )}

        {recState === "stopped" && audioUrl && (
          <>
            {/* Native controls give play/pause/seek for free */}
            <audio
              ref={audioElRef}
              controls
              src={audioUrl}
              preload="metadata"
              className="h-9 flex-1 min-w-[180px] max-w-md"
            />
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {fmt(elapsed)}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9"
              onClick={download}
              aria-label="Download recording"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-destructive hover:text-destructive"
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
                if (noteId) void deleteRecording(noteId);
                await start();
              }}
              className="gap-2"
            >
              <Mic className="h-4 w-4 text-rose-500" />
              Re-record
            </Button>
          </>
        )}
      </div>

      {/* Tap-to-jump chips from [m:ss] markers in the notes */}
      {recState === "stopped" && audioUrl && stamps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t">
          {stamps.map((stamp) => (
            <button
              key={stamp.seconds}
              onClick={() => jumpTo(stamp.seconds)}
              className="rounded-full border bg-background px-2.5 py-1 text-xs font-mono text-primary hover:bg-primary/10 transition-colors"
              title={`Jump to ${stamp.label}`}
            >
              {stamp.label}
            </button>
          ))}
        </div>
      )}

      {recState === "recording" && onStamp && (
        <p className="text-[11px] text-muted-foreground">
          Tap Stamp to drop a [time] marker into your notes — after the sermon,
          tap a marker to jump back to that moment.
        </p>
      )}

      {recState === "stopped" && (
        <p className="text-[11px] text-muted-foreground">
          {persisted
            ? "Saved on this device only — your browser may clear it over time; download to keep it permanently."
            : "Not saved — this recording lives in this tab only; download to keep it."}
        </p>
      )}
    </div>
  );
}
