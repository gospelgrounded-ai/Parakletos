"use client";

import { useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { getBook } from "@/lib/bible-books";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";

interface Token {
  word: string;
  strongs: string | null;
  lemma: string | null;
  translit: string | null;
  definition: string | null;
}

interface InterlinearVerse {
  verse: number;
  tokens: Token[];
}

interface InterlinearData {
  verses: InterlinearVerse[];
  language: "Greek" | "Hebrew";
}

interface InterlinearVerseListProps {
  book: number;
  chapter: number;
  selectedVerse: number | null;
  onVerseClick: (verse: number) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-8" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }, (_, j) => (
              <Skeleton key={j} className="h-16 w-16 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Popover for a clicked token
function TokenPopover({
  token,
  language,
  onClose,
}: {
  token: Token;
  language: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-card border rounded-2xl w-full max-w-sm shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {token.lemma && (
              <p
                className={cn(
                  "text-3xl font-bold leading-none mb-1",
                  language === "Hebrew" && "direction-rtl"
                )}
              >
                {token.lemma}
              </p>
            )}
            {token.translit && (
              <p className="text-base text-muted-foreground italic">
                {token.translit}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
              {token.strongs}
            </span>
            <span className="text-muted-foreground text-xs">{language}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
              English word
            </p>
            <p className="font-medium">{token.word}</p>
          </div>
          {token.definition && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                Definition
              </p>
              <p className="text-foreground/90">{token.definition}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterlinearVerseList({
  book,
  chapter,
  selectedVerse,
  onVerseClick,
}: InterlinearVerseListProps) {
  const [activeToken, setActiveToken] = useState<Token | null>(null);

  const { data, isLoading } = useSWR<InterlinearData>(
    `/api/bible/interlinear?book=${book}&chapter=${chapter}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const bookInfo = getBook(book);
  const bookName = bookInfo?.name ?? "Bible";
  const language = data?.language ?? "Greek";

  return (
    <>
      {activeToken && (
        <TokenPopover
          token={activeToken}
          language={language}
          onClose={() => setActiveToken(null)}
        />
      )}

      <article>
        {/* Chapter heading */}
        <header className="mb-6 select-none">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-muted-foreground/60 tracking-tight">
            {bookName}
          </h1>
          <p className="font-serif text-5xl sm:text-6xl font-bold text-muted-foreground/20 leading-none mt-1">
            {chapter}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
              KJV — {language} Interlinear
            </span>
            <span className="text-xs text-muted-foreground">
              Tap any word to see its {language} root
            </span>
          </div>
        </header>

        {isLoading ? (
          <LoadingSkeleton />
        ) : !data ? (
          <p className="text-muted-foreground text-sm">Failed to load interlinear data.</p>
        ) : (
          <div className="space-y-6">
            {data.verses.map((verse) => (
              <div
                key={verse.verse}
                id={`v${verse.verse}`}
                className={cn(
                  "rounded-lg p-2 -mx-2 cursor-pointer transition-colors",
                  selectedVerse === verse.verse
                    ? "bg-primary/10 outline outline-1 outline-primary/20"
                    : "hover:bg-muted/40"
                )}
                onClick={() => onVerseClick(verse.verse)}
              >
                {/* Verse number */}
                <sup className="text-xs font-semibold text-muted-foreground/60 mr-2 select-none">
                  {verse.verse}
                </sup>

                {/* Token flow */}
                <span className="inline">
                  {verse.tokens.map((token, i) => {
                    const hasStrongs = Boolean(token.strongs);
                    return (
                      <span
                        key={i}
                        className={cn(
                          "inline-flex flex-col items-center mx-0.5 mb-2 px-1 py-0.5 rounded align-bottom",
                          hasStrongs &&
                            "cursor-pointer hover:bg-primary/10 transition-colors"
                        )}
                        onClick={
                          hasStrongs
                            ? (e) => {
                                e.stopPropagation();
                                setActiveToken(token);
                              }
                            : undefined
                        }
                      >
                        {/* Original language word */}
                        {token.lemma ? (
                          <span
                            className={cn(
                              "text-xs text-primary/80 leading-tight",
                              language === "Hebrew" && "font-serif"
                            )}
                          >
                            {token.lemma}
                          </span>
                        ) : (
                          <span className="text-xs text-transparent leading-tight">·</span>
                        )}

                        {/* Transliteration */}
                        {token.translit ? (
                          <span className="text-[10px] text-muted-foreground/70 leading-tight italic">
                            {token.translit}
                          </span>
                        ) : (
                          <span className="text-[10px] text-transparent leading-tight">·</span>
                        )}

                        {/* Strong's number */}
                        {token.strongs ? (
                          <span className="text-[9px] text-muted-foreground/40 leading-tight font-mono">
                            {token.strongs}
                          </span>
                        ) : (
                          <span className="text-[9px] text-transparent leading-tight">·</span>
                        )}

                        {/* English word */}
                        <span
                          className={cn(
                            "leading-tight mt-0.5",
                            hasStrongs
                              ? "font-medium text-foreground"
                              : "text-foreground/70"
                          )}
                          // Respect the reader font-size setting, reduced for word stacks
                          style={{ fontSize: "calc(var(--reader-font-size, 1.25rem) * 0.8)" }}
                        >
                          {token.word}
                        </span>
                      </span>
                    );
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>
    </>
  );
}
