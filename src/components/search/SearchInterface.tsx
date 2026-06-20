"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, BookOpen, ArrowRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { FEATURED_TRANSLATIONS } from "@/lib/bible-api";

// ─── Bible reference parser ────────────────────────────────────────────────────

function buildRefMap(): Map<string, number> {
  const map = new Map<string, number>();
  for (const book of BIBLE_BOOKS) {
    map.set(book.name.toLowerCase(), book.id);
    map.set(book.shortName.toLowerCase(), book.id);
  }
  // Common extra aliases
  const extras: [string, number][] = [
    ["ps", 19], ["psalm", 19], ["prov", 20], ["pro", 20], ["ecc", 21], ["eccl", 21],
    ["sos", 22], ["song", 22], ["songs", 22], ["isa", 23], ["jer", 24], ["lam", 25],
    ["ezek", 26], ["eze", 26], ["dan", 27], ["hos", 28], ["amos", 30], ["obad", 31],
    ["jon", 32], ["mic", 33], ["nah", 34], ["hab", 35], ["zeph", 36], ["zep", 36],
    ["hag", 37], ["zech", 38], ["zec", 38], ["mal", 39], ["matt", 40], ["mat", 40],
    ["mk", 41], ["mar", 41], ["lk", 42], ["jn", 43], ["joh", 43], ["act", 44],
    ["rom", 45], ["1cor", 46], ["2cor", 47], ["gal", 48], ["eph", 49],
    ["phil", 50], ["php", 50], ["col", 51], ["1thes", 52], ["1th", 52],
    ["2thes", 53], ["2th", 53], ["1tim", 54], ["1ti", 54], ["2tim", 55], ["2ti", 55],
    ["tit", 56], ["phlm", 57], ["philem", 57], ["heb", 58], ["jas", 59], ["jam", 59],
    ["1pet", 60], ["1pe", 60], ["2pet", 61], ["2pe", 61],
    ["1jn", 62], ["2jn", 63], ["3jn", 64], ["rev", 66], ["apoc", 66],
  ];
  for (const [alias, id] of extras) map.set(alias, id);
  return map;
}

const REF_MAP = buildRefMap();

interface ParsedRef {
  book: number;
  chapter: number;
  verse?: number;
}

function parseReference(query: string): ParsedRef | null {
  const q = query.trim();
  // e.g. "John 3:16", "1 Sam 2:1", "Gen 1", "psalm 23"
  const m = q.match(/^(\d\s+)?(.+?)\s+(\d+)(?::(\d+))?$/i);
  if (!m) return null;

  const prefix = (m[1] ?? "").trim();
  const bookRaw = m[2].trim().toLowerCase();
  const chapter = parseInt(m[3], 10);
  const verse = m[4] ? parseInt(m[4], 10) : undefined;

  const bookKey = prefix ? `${prefix} ${bookRaw}` : bookRaw;
  const bookId = REF_MAP.get(bookKey) ?? REF_MAP.get(bookRaw);
  if (!bookId) return null;

  const bookInfo = BIBLE_BOOKS.find((b) => b.id === bookId);
  if (!bookInfo || chapter < 1 || chapter > bookInfo.chapters) return null;

  return { book: bookId, chapter, verse };
}

// ─── Keyword highlighting ──────────────────────────────────────────────────────

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const term = query.trim();
  if (!term) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(term)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-200/80 dark:bg-yellow-800/50 text-foreground rounded-sm px-0.5 not-italic"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

// ─── Types & skeletons ────────────────────────────────────────────────────────

interface SearchResult {
  book: number;
  chapter: number;
  verse: number;
  text: string;
  bookName: string;
}

type Testament = "all" | "OT" | "NT";

function ResultSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SearchInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialT = searchParams.get("t") ?? "KJV";

  const [query, setQuery] = useState(initialQ);
  const [translation, setTranslation] = useState(initialT);
  const [testament, setTestament] = useState<Testament>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync URL → state on mount if initial query exists
  useEffect(() => {
    if (initialQ) {
      performSearch(initialQ, translation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performSearch = useCallback(async (q: string, t: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `/api/bible/search?q=${encodeURIComponent(q.trim())}&translation=${t}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search + URL sync
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        const params = new URLSearchParams({ q: query.trim(), t: translation });
        router.replace(`?${params.toString()}`, { scroll: false });
      } else {
        router.replace("?", { scroll: false });
      }
      performSearch(query, translation);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, translation, performSearch, router]);

  // Bible reference detection
  const parsedRef = query.trim().length >= 3 ? parseReference(query) : null;

  // Filter results by testament client-side
  const filteredResults =
    testament === "all"
      ? results
      : results.filter((r) => {
          const b = BIBLE_BOOKS.find((b) => b.id === r.book);
          return b?.testament === testament;
        });

  const otCount = results.filter((r) => {
    const b = BIBLE_BOOKS.find((b) => b.id === r.book);
    return b?.testament === "OT";
  }).length;
  const ntCount = results.length - otCount;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    performSearch(query, translation);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a word, phrase, or reference…"
            className={cn(
              "w-full pl-10 pr-4 py-3 text-base rounded-lg border bg-background",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "placeholder:text-muted-foreground"
            )}
            autoFocus
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Translation selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Translation:
            </label>
            <select
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {FEATURED_TRANSLATIONS.map((t) => (
                <option key={t.short_name} value={t.short_name}>
                  {t.short_name} — {t.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* Bible reference shortcut */}
      {parsedRef && (
        <Link
          href={`/bible/${translation}/${parsedRef.book}/${parsedRef.chapter}${parsedRef.verse ? `#v${parsedRef.verse}` : ""}`}
          className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 hover:bg-primary/10 transition-colors"
        >
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-primary">
            Go to{" "}
            {BIBLE_BOOKS.find((b) => b.id === parsedRef.book)?.name}{" "}
            {parsedRef.chapter}
            {parsedRef.verse ? `:${parsedRef.verse}` : ""}
          </span>
          <ArrowRight className="h-4 w-4 text-primary ml-auto shrink-0" />
        </Link>
      )}

      {/* Results area */}
      {isLoading ? (
        <ResultSkeleton />
      ) : hasSearched && results.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm mt-1">Try a different search term or translation.</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {/* Result count + testament filter */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span>{" "}
              result{results.length !== 1 ? "s" : ""} for{" "}
              <span className="italic">"{query.trim()}"</span>
            </p>

            {/* Testament filter */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {(
                [
                  ["all", `All (${results.length})`],
                  ["OT", `OT (${otCount})`],
                  ["NT", `NT (${ntCount})`],
                ] as [Testament, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTestament(value)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    testament === value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Result list */}
          <ul className="space-y-2">
            {filteredResults.map((result, idx) => {
              const reference = `${result.bookName} ${result.chapter}:${result.verse}`;
              return (
                <li key={`${result.book}-${result.chapter}-${result.verse}-${idx}`}>
                  <Link
                    href={`/bible/${translation}/${result.book}/${result.chapter}#v${result.verse}`}
                    className={cn(
                      "block rounded-lg border p-4 transition-colors",
                      "hover:bg-muted/50 hover:border-primary/40"
                    )}
                  >
                    <p className="text-sm font-semibold text-primary mb-1.5">
                      {reference}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed font-serif">
                      <HighlightedText text={result.text} query={query.trim()} />
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>

          {results.length === 50 && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              Showing top 50 results. Refine your query for more specific results.
            </p>
          )}
        </div>
      ) : !hasSearched ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Start typing to search across Scripture.</p>
          <p className="text-xs mt-1 opacity-70">
            Try "love" or jump to a passage like "John 3:16"
          </p>
        </div>
      ) : null}
    </div>
  );
}
