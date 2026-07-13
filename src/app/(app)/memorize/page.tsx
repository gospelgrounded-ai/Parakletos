"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { formatReference } from "@/lib/bible-books";
import { maskVerseText, type MaskMode } from "@/lib/memory-mask";
import { Brain, Check, Eye, EyeOff, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoryVerse {
  id: string;
  translation: string;
  book: number;
  chapter: number;
  verse: number;
  box: number;
  nextReview: string;
}

const MODES: MaskMode[] = ["full", "hint", "blank"];
const MODE_LABEL: Record<MaskMode, string> = {
  full: "Full text",
  hint: "First letters",
  blank: "Hidden",
};

export default function MemorizePage() {
  const [allVerses, setAllVerses] = useState<MemoryVerse[] | null>(null);
  const [queue, setQueue] = useState<MemoryVerse[]>([]);
  const [index, setIndex] = useState(0);
  const [verseText, setVerseText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [mode, setMode] = useState<MaskMode>("full");
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    fetch("/api/memory-verses")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: MemoryVerse[]) => {
        setAllVerses(data);
        const now = Date.now();
        setQueue(data.filter((v) => new Date(v.nextReview).getTime() <= now));
      })
      .catch(() => setAllVerses([]));
  }, []);

  const current = queue[index];

  useEffect(() => {
    if (!current) return;
    setMode("full");
    setLoadingText(true);
    setVerseText(null);
    fetch(`/api/bible/${current.translation}/${current.book}/${current.chapter}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { verses?: Array<{ verse: number; text: string }> } | null) => {
        const target = data?.verses?.find((v) => v.verse === current.verse);
        setVerseText(target?.text ?? null);
      })
      .catch(() => setVerseText(null))
      .finally(() => setLoadingText(false));
  }, [current]);

  const reference = current ? formatReference(current.book, current.chapter, current.verse) : "";

  const nextDue = useMemo(() => {
    if (!allVerses || allVerses.length === 0) return null;
    return allVerses.reduce(
      (min, v) => (new Date(v.nextReview) < new Date(min.nextReview) ? v : min),
      allVerses[0]
    );
  }, [allVerses]);

  async function grade(gotIt: boolean) {
    if (!current) return;
    try {
      await fetch(`/api/memory-verses/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gotIt }),
      });
    } catch {
      // best-effort — still advance so the session doesn't stall
    }
    setCompletedCount((c) => c + 1);
    setIndex((i) => i + 1);
  }

  function cycleMode() {
    const i = MODES.indexOf(mode);
    setMode(MODES[(i + 1) % MODES.length]);
  }

  if (allVerses === null) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  if (allVerses.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4">
        <EmptyState
          icon={Brain}
          title="Nothing to memorize yet"
          hint='While reading, tap a verse and choose "Memorize" to add it here.'
          action={
            <Link href="/bible" className="text-sm text-primary font-medium hover:underline">
              Go to the Bible reader
            </Link>
          }
        />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Check className="h-10 w-10 mx-auto mb-4 text-primary" />
        <h1 className="text-xl font-semibold mb-2">
          {completedCount > 0 ? "All done for today!" : "You're all caught up!"}
        </h1>
        <p className="text-sm text-muted-foreground mb-1">
          {allVerses.length} verse{allVerses.length === 1 ? "" : "s"} in your memorization list.
        </p>
        {nextDue && (
          <p className="text-xs text-muted-foreground mb-6">
            Next review: {new Date(nextDue.nextReview).toLocaleDateString()}
          </p>
        )}
        <Link href="/home" className="text-sm text-primary font-medium hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-24">
      <Link
        href="/home"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 -ml-0.5 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Home
      </Link>

      <p className="text-xs text-muted-foreground mb-1">
        {index + 1} of {queue.length} due today
      </p>
      <h1 className="text-lg font-semibold mb-6">{reference}</h1>

      <div className="rounded-xl border bg-card p-6 min-h-[140px] flex items-center justify-center text-center">
        {loadingText ? (
          <p className="text-sm text-muted-foreground">Loading verse…</p>
        ) : verseText ? (
          <p className="font-serif text-lg leading-relaxed">
            {maskVerseText(verseText, mode)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Couldn&apos;t load this verse.</p>
        )}
      </div>

      <button
        onClick={cycleMode}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
      >
        {mode === "full" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        {MODE_LABEL[mode]} — tap to hide more
      </button>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Button
          variant="outline"
          onClick={() => grade(false)}
          className={cn("gap-2")}
        >
          <X className="h-4 w-4" />
          Missed it
        </Button>
        <Button onClick={() => grade(true)} className="gap-2">
          <Check className="h-4 w-4" />
          Got it
        </Button>
      </div>
    </div>
  );
}
