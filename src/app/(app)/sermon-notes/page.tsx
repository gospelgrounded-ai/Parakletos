"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { MapPin, NotebookPen, Plus, Search, Star, User } from "lucide-react";

interface SermonNote {
  id: string;
  title: string;
  date: string;
  speaker: string;
  location: string;
  notes: string;
  series: string;
  tags: string;
  isFavorite: boolean;
  updatedAt: string;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type Filter = { kind: "all" } | { kind: "favorites" } | { kind: "series"; name: string };

function NoteRow({ note, onOpen }: { note: SermonNote; onOpen: () => void }) {
  return (
    <li>
      <button
        onClick={onOpen}
        className="w-full text-left rounded-lg border p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="font-medium leading-tight flex items-center gap-1.5 min-w-0">
            {note.isFavorite && (
              <Star className="h-3.5 w-3.5 text-amber-500 fill-current shrink-0" />
            )}
            <span className="truncate">{note.title || "Untitled Sermon"}</span>
          </span>
          <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
            {formatDate(note.date)}
          </span>
        </div>

        {(note.speaker || note.location) && (
          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
            {note.speaker && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {note.speaker}
              </span>
            )}
            {note.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {note.location}
              </span>
            )}
          </div>
        )}

        {note.tags && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {note.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}

        {note.notes && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{note.notes}</p>
        )}
      </button>
    </li>
  );
}

export default function SermonNotesPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const { data: notes, isLoading, error, mutate } = useSWR<SermonNote[]>(
    "/api/sermon-notes",
    fetcher
  );

  const seriesNames = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes ?? []) if (n.series) set.add(n.series);
    return [...set].sort();
  }, [notes]);

  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = notes ?? [];
    if (filter.kind === "favorites") list = list.filter((n) => n.isFavorite);
    if (filter.kind === "series") list = list.filter((n) => n.series === filter.name);
    if (query) {
      list = list.filter((n) =>
        [n.title, n.speaker, n.location, n.series, n.tags, n.notes]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }
    return list;
  }, [notes, filter, query]);

  // Group by series (with "Ungrouped" fallback) unless a specific series is
  // selected — then a flat list reads better.
  const grouped = useMemo(() => {
    if (filter.kind === "series") return null;
    if (seriesNames.length === 0) return null;
    const groups = new Map<string, SermonNote[]>();
    for (const n of filtered) {
      const key = n.series || "Ungrouped";
      const arr = groups.get(key) ?? [];
      arr.push(n);
      groups.set(key, arr);
    }
    return [...groups.entries()];
  }, [filtered, filter, seriesNames]);

  async function createNote() {
    setCreating(true);
    try {
      // Reuse an abandoned blank note instead of accumulating ghosts
      const blank = (notes ?? []).find(
        (n) =>
          (!n.title || n.title === "Untitled Sermon") &&
          !n.speaker &&
          !n.location &&
          !n.notes &&
          !n.series &&
          !n.tags &&
          !n.isFavorite
      );
      if (blank) {
        router.push(`/sermon-notes/${blank.id}`);
        return;
      }
      const res = await fetch("/api/sermon-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const note = await res.json();
        router.push(`/sermon-notes/${note.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  const hasNotes = !!notes && notes.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sermon Notes</h1>
        <Button onClick={createNote} disabled={creating} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Sermon Note</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {hasNotes && (
        <>
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles, speakers, series, tags, and notes…"
              className="pl-9"
            />
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            <button
              onClick={() => setFilter({ kind: "all" })}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                filter.kind === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              onClick={() => setFilter({ kind: "favorites" })}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1",
                filter.kind === "favorites"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star className="h-3 w-3" />
              Favorites
            </button>
            {seriesNames.map((name) => (
              <button
                key={name}
                onClick={() => setFilter({ kind: "series", name })}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors max-w-[200px] truncate",
                  filter.kind === "series" && filter.name === name
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <EmptyState
          icon={NotebookPen}
          title="Couldn't load your notes"
          hint="Check your connection and try again."
          action={
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Retry
            </Button>
          }
        />
      )}

      {!isLoading && !error && !hasNotes && (
        <EmptyState
          icon={NotebookPen}
          title="No sermon notes yet"
          hint="Create your first note to get started."
        />
      )}

      {!isLoading && !error && hasNotes && filtered.length === 0 && (
        <EmptyState icon={Search} title="No matches" />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        grouped ? (
          <div className="space-y-6">
            {grouped.map(([name, items]) => (
              <div key={name}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {name}
                  </h3>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <ul className="space-y-2">
                  {items.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      onOpen={() => router.push(`/sermon-notes/${note.id}`)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                onOpen={() => router.push(`/sermon-notes/${note.id}`)}
              />
            ))}
          </ul>
        )
      )}
    </div>
  );
}
