"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface UseAutosaveOptions<T> {
  /** Persist the payload; resolve true on success. */
  save: (payload: T) => Promise<boolean>;
  delay?: number;
}

/**
 * Debounced autosave shared by the sermon-note and prayer editors.
 *
 * A pending payload is flushed:
 * - after `delay` ms of inactivity (normal path),
 * - on unmount — SPA navigation keeps the page alive, so a normal fetch
 *   works and edits made moments before hitting Back are not lost,
 * - when the tab is hidden (visibilitychange),
 * - best-effort on beforeunload. A hard close can still drop the request;
 *   fetch keepalive caps bodies at 64 KiB, which long notes exceed, so we
 *   don't rely on it — the visibilitychange flush is the realistic path.
 */
export function useAutosave<T>({ save, delay = 1500 }: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<T | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const payload = pendingRef.current;
    if (payload === null) return;
    pendingRef.current = null;
    setStatus("saving");
    let ok = false;
    try {
      ok = await saveRef.current(payload);
    } catch {
      ok = false;
    }
    setStatus(ok ? "saved" : "error");
  }, []);

  const schedule = useCallback(
    (payload: T) => {
      pendingRef.current = payload;
      setStatus("pending");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush();
      }, delay);
    },
    [delay, flush]
  );

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") void flush();
    }
    function onBeforeUnload() {
      void flush();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      void flush();
    };
  }, [flush]);

  return { status, schedule, flush };
}
