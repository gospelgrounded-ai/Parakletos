"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BOOK_BY_ID } from "@/lib/bible-books";

const TRANSLATIONS = ["KJV", "NKJV", "WEB", "ASV", "YLT", "BBE"] as const;
type Translation = (typeof TRANSLATIONS)[number];

interface BollsSearchResult {
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

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

export default function SearchInterface() {
  const [query, setQuery] = useState("");
  const [translation, setTranslation] = useState<Translation>("KJV");
  const [results, setResults] = useState<BollsSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(
    async (q: string, t: Translation) => {
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
    },
    []
  );

  // Debounced search on query/translation change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(query, translation);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, translation, performSearch]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a word, phrase, or passage..."
            className={cn(
              "w-full pl-10 pr-4 py-3 text-base rounded-lg border bg-background",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "placeholder:text-muted-foreground"
            )}
            autoFocus
          />
        </div>

        {/* Translation selector */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="translation-select"
            className="text-sm font-medium text-muted-foreground whitespace-nowrap"
          >
            Translation:
          </label>
          <select
            id="translation-select"
            value={translation}
            onChange={(e) => setTranslation(e.target.value as Translation)}
            className={cn(
              "rounded-md border bg-background px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
          >
            {TRANSLATIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </form>

      {/* Results area */}
      {isLoading ? (
        <ResultSkeleton />
      ) : hasSearched && results.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm mt-1">
            Try a different search term or translation.
          </p>
        </div>
      ) : results.length > 0 ? (
        <ul className="space-y-3">
          {results.map((result, idx) => {
            const bookName =
              BOOK_BY_ID.get(result.book)?.name ?? `Book ${result.book}`;
            const reference = `${bookName} ${result.chapter}:${result.verse}`;
            const snippet =
              result.text.length > 120
                ? result.text.slice(0, 120).trimEnd() + "…"
                : result.text;

            return (
              <li key={`${result.book}-${result.chapter}-${result.verse}-${idx}`}>
                <Link
                  href={`/bible/${translation}/${result.book}/${result.chapter}`}
                  className={cn(
                    "block rounded-lg border p-4 transition-colors",
                    "hover:bg-muted/50 hover:border-primary/40"
                  )}
                >
                  <p className="text-sm font-semibold text-primary mb-1">
                    {reference}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {snippet}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : !hasSearched ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">
            Start typing to search across Scripture.
          </p>
        </div>
      ) : null}
    </div>
  );
}
