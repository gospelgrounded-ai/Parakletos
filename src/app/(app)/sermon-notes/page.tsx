"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, NotebookPen, Plus, User } from "lucide-react";

interface SermonNote {
  id: string;
  title: string;
  date: string;
  speaker: string;
  location: string;
  notes: string;
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

export default function SermonNotesPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const { data: notes, isLoading } = useSWR<SermonNote[]>("/api/sermon-notes", fetcher);

  async function createNote() {
    setCreating(true);
    try {
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

      {!isLoading && (!notes || notes.length === 0) && (
        <div className="text-center py-16 text-muted-foreground">
          <NotebookPen className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No sermon notes yet.</p>
          <p className="text-xs mt-1 opacity-70">Create your first note to get started.</p>
        </div>
      )}

      {!isLoading && notes && notes.length > 0 && (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                onClick={() => router.push(`/sermon-notes/${note.id}`)}
                className="w-full text-left rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium leading-tight">
                    {note.title || "Untitled Sermon"}
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

                {note.notes && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{note.notes}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
