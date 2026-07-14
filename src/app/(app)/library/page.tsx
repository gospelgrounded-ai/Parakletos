"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { HighlightColor, getHighlightClass } from "@/types";
import Link from "next/link";
import {
  Bookmark, FileText, Search, Highlighter, NotebookPen, ArrowRight, Trash2, Check,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BaseEntry {
  id: string;
  translation: string;
  book: number;
  chapter: number;
  verse: number;
  bookName: string;
  reference: string;
  text: string;
  createdAt: string;
}
interface HighlightEntry extends BaseEntry {
  color: HighlightColor;
}
interface BookmarkEntry extends BaseEntry {
  label?: string | null;
}
interface NoteEntry extends BaseEntry {
  content: string;
}

interface StudyData {
  highlights: HighlightEntry[];
  bookmarks: BookmarkEntry[];
  notes: NoteEntry[];
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function colorDot(color: HighlightColor) {
  const bg = getHighlightClass(color) || "bg-muted";
  return <span className={cn("inline-block w-3 h-3 rounded-full shrink-0", bg)} />;
}

/** Group entries by book, preserving canonical order (entries arrive book-sorted). */
function groupByBook<T extends BaseEntry>(entries: T[]): Array<[string, T[]]> {
  const groups = new Map<string, T[]>();
  for (const e of entries) {
    const arr = groups.get(e.bookName) ?? [];
    arr.push(e);
    groups.set(e.bookName, arr);
  }
  return [...groups.entries()];
}

// ─── Shared UI ───────────────────────────────────────────────────────────────

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

function BookGroup({
  bookName,
  count,
  children,
}: {
  bookName: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {bookName}
        </h3>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function DeleteButton({ onConfirm, label }: { onConfirm: () => void; label: string }) {
  const [confirming, setConfirming] = useState(false);
  // Confirm state auto-expires so a stray first tap doesn't arm it forever
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);
  return (
    <button
      onClick={() => {
        if (confirming) {
          onConfirm();
          setConfirming(false);
        } else {
          setConfirming(true);
        }
      }}
      aria-label={confirming ? `Confirm delete ${label}` : `Delete ${label}`}
      className={cn(
        "shrink-0 min-w-[44px] rounded-lg border transition-colors flex items-center justify-center",
        confirming
          ? "bg-destructive text-destructive-foreground border-destructive"
          : "text-muted-foreground hover:text-destructive hover:border-destructive/40"
      )}
    >
      {confirming ? <Check className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

function HighlightsTab({
  data,
  query,
  onDelete,
}: {
  data: HighlightEntry[];
  query: string;
  onDelete: (e: HighlightEntry) => void;
}) {
  const router = useRouter();
  const filtered = useMemo(
    () =>
      data.filter(
        (h) =>
          h.reference.toLowerCase().includes(query) ||
          h.text.toLowerCase().includes(query)
      ),
    [data, query]
  );

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Highlighter}
        title="No highlights yet"
        hint="Highlight a verse while reading to save it here."
      />
    );
  }
  if (filtered.length === 0) {
    return <EmptyState icon={Search} title="No matches" />;
  }

  return (
    <div className="space-y-6">
      {groupByBook(filtered).map(([bookName, items]) => (
        <BookGroup key={bookName} bookName={bookName} count={items.length}>
          {items.map((h) => (
            <li key={h.id} className="flex items-stretch gap-1.5">
              <button
                onClick={() =>
                  router.push(`/bible/${h.translation}/${h.book}/${h.chapter}#v${h.verse}`)
                }
                className="flex-1 min-w-0 text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  {colorDot(h.color)}
                  <span className="text-sm font-medium">{h.reference}</span>
                  <span className="text-xs text-muted-foreground">{h.translation}</span>
                </div>
                {h.text && (
                  <p className="text-sm text-muted-foreground font-serif line-clamp-2 ml-5">
                    {h.text}
                  </p>
                )}
              </button>
              <DeleteButton label="highlight" onConfirm={() => onDelete(h)} />
            </li>
          ))}
        </BookGroup>
      ))}
    </div>
  );
}

function BookmarksTab({
  data,
  query,
  onDelete,
}: {
  data: BookmarkEntry[];
  query: string;
  onDelete: (e: BookmarkEntry) => void;
}) {
  const router = useRouter();
  const filtered = useMemo(
    () =>
      data.filter(
        (b) =>
          b.reference.toLowerCase().includes(query) ||
          b.text.toLowerCase().includes(query) ||
          (b.label ?? "").toLowerCase().includes(query)
      ),
    [data, query]
  );

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="No bookmarks yet"
        hint="Bookmark a verse while reading to save it here."
      />
    );
  }
  if (filtered.length === 0) {
    return <EmptyState icon={Search} title="No matches" />;
  }

  return (
    <div className="space-y-6">
      {groupByBook(filtered).map(([bookName, items]) => (
        <BookGroup key={bookName} bookName={bookName} count={items.length}>
          {items.map((b) => (
            <li key={b.id} className="flex items-stretch gap-1.5">
              <button
                onClick={() =>
                  router.push(`/bible/${b.translation}/${b.book}/${b.chapter}#v${b.verse}`)
                }
                className="flex-1 min-w-0 text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Bookmark className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium">{b.reference}</span>
                  <span className="text-xs text-muted-foreground">{b.translation}</span>
                </div>
                {b.text && (
                  <p className="text-sm text-muted-foreground font-serif line-clamp-2 ml-6">
                    {b.text}
                  </p>
                )}
                {b.label && (
                  <p className="text-xs text-primary/80 mt-1 ml-6">{b.label}</p>
                )}
              </button>
              <DeleteButton label="bookmark" onConfirm={() => onDelete(b)} />
            </li>
          ))}
        </BookGroup>
      ))}
    </div>
  );
}

function NotesTab({
  data,
  query,
  onDelete,
}: {
  data: NoteEntry[];
  query: string;
  onDelete: (e: NoteEntry) => void;
}) {
  const router = useRouter();
  const filtered = useMemo(
    () =>
      data.filter(
        (n) =>
          n.reference.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query) ||
          n.text.toLowerCase().includes(query)
      ),
    [data, query]
  );

  if (data.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No notes yet"
        hint="Add a note to a verse while reading to save it here."
      />
    );
  }
  if (filtered.length === 0) {
    return <EmptyState icon={Search} title="No matches" />;
  }

  return (
    <div className="space-y-6">
      {groupByBook(filtered).map(([bookName, items]) => (
        <BookGroup key={bookName} bookName={bookName} count={items.length}>
          {items.map((n) => (
            <li key={n.id} className="flex items-stretch gap-1.5">
              <button
                onClick={() =>
                  router.push(`/bible/${n.translation}/${n.book}/${n.chapter}#v${n.verse}`)
                }
                className="flex-1 min-w-0 text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium">{n.reference}</span>
                  <span className="text-xs text-muted-foreground">{n.translation}</span>
                </div>
                {n.text && (
                  <p className="text-xs text-muted-foreground font-serif italic line-clamp-1 ml-6 mb-1">
                    {n.text}
                  </p>
                )}
                <p className="text-sm ml-6 line-clamp-3 whitespace-pre-wrap">{n.content}</p>
              </button>
              <DeleteButton label="note" onConfirm={() => onDelete(n)} />
            </li>
          ))}
        </BookGroup>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const { data, isLoading, mutate } = useSWR<StudyData>("/api/user/study", fetcher);

  async function handleDelete(url: string, what: string) {
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`${what} removed`);
      mutate();
    } catch {
      toast.error(`Failed to remove ${what.toLowerCase()}`);
    }
  }

  const highlights = data?.highlights ?? [];
  const bookmarks = data?.bookmarks ?? [];
  const notes = data?.notes ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <h1 className="text-2xl font-bold mb-4">Your Library</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your highlights, notes, and references…"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : (
        <Tabs defaultValue="highlights">
          <TabsList className="mb-6">
            <TabsTrigger value="highlights">
              Highlights{highlights.length ? ` (${highlights.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="bookmarks">
              Bookmarks{bookmarks.length ? ` (${bookmarks.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="notes">
              Notes{notes.length ? ` (${notes.length})` : ""}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="highlights">
            <HighlightsTab
              data={highlights}
              query={query}
              onDelete={(h) =>
                handleDelete(
                  `/api/user/highlights?translation=${encodeURIComponent(h.translation)}&book=${h.book}&chapter=${h.chapter}&verse=${h.verse}`,
                  "Highlight"
                )
              }
            />
          </TabsContent>
          <TabsContent value="bookmarks">
            <BookmarksTab
              data={bookmarks}
              query={query}
              onDelete={(b) => handleDelete(`/api/user/bookmarks?id=${b.id}`, "Bookmark")}
            />
          </TabsContent>
          <TabsContent value="notes">
            <NotesTab
              data={notes}
              query={query}
              onDelete={(n) => handleDelete(`/api/user/notes?id=${n.id}`, "Note")}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Sermon Notes shortcut — shown below the tab content */}
      <Link
        href="/sermon-notes"
        className="mt-8 flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <NotebookPen className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium">Sermon Notes</p>
            <p className="text-xs text-muted-foreground">Long-form outlines and study notes</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </Link>
    </div>
  );
}
