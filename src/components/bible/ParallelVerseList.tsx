"use client";

import useSWR from "swr";
import { cn } from "@/lib/utils";
import { getBook } from "@/lib/bible-books";
import { HighlightColor, getHighlightClass } from "@/types";
import { Bookmark, PenLine } from "lucide-react";

interface ParallelVerseListProps {
  verses: Array<{ pk: number; verse: number; text: string }>;
  translation: string;
  parallelTranslation: string;
  book: number;
  chapter: number;
  highlights: Map<number, { id: string; color: string }>;
  bookmarks: Set<number>;
  notes: Map<number, { id: string; content: string }>;
  selectedVerse: number | null;
  onVerseClick: (verse: number) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ParallelVerseList({
  verses,
  translation,
  parallelTranslation,
  book,
  chapter,
  highlights,
  bookmarks,
  notes,
  selectedVerse,
  onVerseClick,
}: ParallelVerseListProps) {
  const { data: secondaryData } = useSWR(
    `/api/bible/${parallelTranslation}/${book}/${chapter}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const secondaryMap = new Map<number, string>(
    (secondaryData?.verses ?? []).map(
      (v: { verse: number; text: string }) => [v.verse, v.text]
    )
  );

  const bookInfo = getBook(book);
  const bookName = bookInfo?.name ?? "Bible";

  return (
    <article>
      {/* Chapter heading */}
      <header className="mb-6 select-none">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-muted-foreground/60 tracking-tight">
          {bookName}
        </h1>
        <p className="font-serif text-5xl sm:text-6xl font-bold text-muted-foreground/20 leading-none mt-1">
          {chapter}
        </p>
      </header>

      {/* Column headers — phones stack the columns, so headers only on sm+ */}
      <div className="hidden sm:grid grid-cols-2 mb-3 pb-2 border-b">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {translation}
        </p>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-3 border-l border-border/60">
          {parallelTranslation}
          {!secondaryData && (
            <span className="ml-1.5 text-muted-foreground/40 normal-case font-normal tracking-normal">
              loading…
            </span>
          )}
        </p>
      </div>

      {/* Parallel verse rows */}
      <div className="divide-y divide-border/30">
        {verses.map((verse) => {
          const secondaryText = secondaryMap.get(verse.verse);
          const highlight = highlights.get(verse.verse);
          const highlightClass = highlight
            ? getHighlightClass(highlight.color as HighlightColor)
            : null;
          const isSelected = selectedVerse === verse.verse;
          const isBookmarked = bookmarks.has(verse.verse);
          const hasNote = notes.has(verse.verse);

          return (
            <div
              key={verse.pk}
              id={`v${verse.verse}`}
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2 py-2.5 cursor-pointer rounded-sm transition-colors",
                "hover:bg-primary/5",
                isSelected && "bg-primary/10 outline outline-1 outline-primary/20"
              )}
              onClick={() => onVerseClick(verse.verse)}
              // Respect the reader font-size setting, slightly reduced for columns
              style={{ fontSize: "calc(var(--reader-font-size, 1.25rem) * 0.85)" }}
            >
              {/* Primary column */}
              <div className="sm:pr-3 leading-relaxed bible-text" style={{ fontSize: "inherit" }}>
                <sup className="bible-verse-num select-none mr-0.5">{verse.verse}</sup>
                {highlightClass ? (
                  <mark className={cn("bg-transparent rounded-sm", highlightClass)}>
                    {verse.text}
                  </mark>
                ) : (
                  <span>{verse.text}</span>
                )}
                {(isBookmarked || hasNote) && (
                  <span className="inline-flex items-center gap-0.5 ml-0.5 align-middle">
                    {isBookmarked && (
                      <Bookmark className="inline-block h-2.5 w-2.5 fill-primary/60 text-primary/60" />
                    )}
                    {hasNote && (
                      <PenLine className="inline-block h-2.5 w-2.5 text-amber-500/80" />
                    )}
                  </span>
                )}
              </div>

              {/* Secondary column — stacks under the primary on phones */}
              <div
                className="mt-1 sm:mt-0 sm:pl-3 leading-relaxed bible-text text-foreground/70 sm:border-l border-border/60"
                style={{ fontSize: "inherit" }}
              >
                <span className="sm:hidden text-[10px] font-sans font-semibold uppercase tracking-wider text-muted-foreground mr-1.5 align-middle">
                  {parallelTranslation}
                </span>
                <sup className="bible-verse-num select-none mr-0.5 opacity-50">{verse.verse}</sup>
                {secondaryText ?? <span className="opacity-20">—</span>}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
