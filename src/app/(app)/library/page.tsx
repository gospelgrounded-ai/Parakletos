"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BOOK_BY_ID } from "@/lib/bible-books";
import { HighlightColor, HIGHLIGHT_COLORS } from "@/types";
import { BookOpen, Bookmark, FileText } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LibraryHighlight {
  id: string;
  translation: string;
  book: number;
  chapter: number;
  verse: number;
  color: HighlightColor;
  createdAt: string;
}

interface LibraryBookmark {
  id: string;
  translation: string;
  book: number;
  chapter: number;
  verse: number;
  label?: string | null;
  bookName?: string;
  createdAt: string;
}

interface LibraryNote {
  id: string;
  translation: string;
  book: number;
  chapter: number;
  verse: number;
  content: string;
  createdAt: string;
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatReference(
  book: number,
  chapter: number,
  verse: number,
  bookName?: string
): string {
  const name = bookName ?? BOOK_BY_ID.get(book)?.name ?? `Book ${book}`;
  return `${name} ${chapter}:${verse}`;
}

function getColorDot(color: HighlightColor) {
  const found = HIGHLIGHT_COLORS.find((c) => c.color === color);
  const bgClass = found?.bg ?? "bg-gray-200";
  return <span className={cn("inline-block w-3 h-3 rounded-full", bgClass)} />;
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Tab content components ───────────────────────────────────────────────────

function HighlightsTab() {
  const router = useRouter();
  const { data, isLoading } = useSWR<{ highlights: LibraryHighlight[] }>(
    "/api/user/highlights?all=true",
    fetcher
  );

  if (isLoading) return <ListSkeleton />;

  const highlights = data?.highlights ?? [];

  if (highlights.length === 0) {
    return (
      <EmptyState message="No highlights yet. Highlight a verse while reading to save it here." />
    );
  }

  // Group by color
  const grouped = HIGHLIGHT_COLORS.reduce<
    Record<HighlightColor, LibraryHighlight[]>
  >(
    (acc, { color }) => {
      acc[color] = highlights.filter((h) => h.color === color);
      return acc;
    },
    {} as Record<HighlightColor, LibraryHighlight[]>
  );

  return (
    <div className="space-y-6">
      {HIGHLIGHT_COLORS.map(({ color, label }) => {
        const items = grouped[color];
        if (!items || items.length === 0) return null;
        return (
          <div key={color}>
            <div className="flex items-center gap-2 mb-2">
              {getColorDot(color)}
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {label}
              </h3>
              <span className="text-xs text-muted-foreground">
                ({items.length})
              </span>
            </div>
            <ul className="space-y-2">
              {items.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() =>
                      router.push(
                        `/bible/${h.translation}/${h.book}/${h.chapter}`
                      )
                    }
                    className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      {formatReference(h.book, h.chapter, h.verse)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {h.translation}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function BookmarksTab() {
  const router = useRouter();
  const { data, isLoading } = useSWR<{ bookmarks: LibraryBookmark[] }>(
    "/api/user/bookmarks",
    fetcher
  );

  if (isLoading) return <ListSkeleton />;

  const bookmarks = data?.bookmarks ?? [];

  if (bookmarks.length === 0) {
    return (
      <EmptyState message="No bookmarks yet. Bookmark a verse while reading to save it here." />
    );
  }

  return (
    <ul className="space-y-2">
      {bookmarks.map((bm) => (
        <li key={bm.id}>
          <button
            onClick={() =>
              router.push(`/bible/${bm.translation}/${bm.book}/${bm.chapter}`)
            }
            className="w-full text-left rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">
                  {formatReference(bm.book, bm.chapter, bm.verse, bm.bookName)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {bm.translation}
                </span>
              </div>
            </div>
            {bm.label && (
              <p className="text-sm text-muted-foreground mt-1 ml-6">
                {bm.label}
              </p>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

function NotesTab() {
  const router = useRouter();
  const { data, isLoading } = useSWR<{ notes: LibraryNote[] }>(
    "/api/user/notes?all=true",
    fetcher
  );

  if (isLoading) return <ListSkeleton />;

  const notes = data?.notes ?? [];

  if (notes.length === 0) {
    return (
      <EmptyState message="No notes yet. Add a note to a verse while reading to save it here." />
    );
  }

  return (
    <ul className="space-y-2">
      {notes.map((note) => (
        <li key={note.id}>
          <button
            onClick={() =>
              router.push(
                `/bible/${note.translation}/${note.book}/${note.chapter}`
              )
            }
            className="w-full text-left rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">
                {formatReference(note.book, note.chapter, note.verse)}
              </span>
              <span className="text-xs text-muted-foreground">
                {note.translation}
              </span>
            </div>
            <p className="text-sm text-muted-foreground ml-6 line-clamp-2">
              {note.content.length > 100
                ? note.content.slice(0, 100).trimEnd() + "…"
                : note.content}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <h1 className="text-2xl font-bold mb-6">Your Library</h1>
      <Tabs defaultValue="highlights">
        <TabsList className="mb-6">
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="highlights">
          <HighlightsTab />
        </TabsContent>
        <TabsContent value="bookmarks">
          <BookmarksTab />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
