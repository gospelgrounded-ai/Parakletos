"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/shared/EmptyState";
import { HandHeart, CheckCircle2, Plus, type LucideIcon } from "lucide-react";

interface PrayerEntry {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
  answeredAt: string | null;
  updatedAt: string;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EntryList({
  entries,
  emptyIcon,
  emptyTitle,
  emptyHint,
  onSelect,
}: {
  entries: PrayerEntry[];
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyHint?: string;
  onSelect: (id: string) => void;
}) {
  if (entries.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id}>
          <button
            onClick={() => onSelect(entry.id)}
            className="w-full text-left rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium leading-tight">
                {entry.title || "Untitled prayer"}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                {formatDate(entry.isAnswered && entry.answeredAt ? entry.answeredAt : entry.updatedAt)}
              </span>
            </div>
            {entry.content && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                {entry.content}
              </p>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function PrayerJournalPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const { data: entries, isLoading } = useSWR<PrayerEntry[]>("/api/prayer", fetcher);

  const open = useMemo(() => (entries ?? []).filter((e) => !e.isAnswered), [entries]);
  const answered = useMemo(() => (entries ?? []).filter((e) => e.isAnswered), [entries]);

  async function createEntry() {
    setCreating(true);
    try {
      // Reuse an abandoned blank entry instead of accumulating ghosts
      const blank = (entries ?? []).find(
        (e) => !e.title && !e.content && !e.isAnswered
      );
      if (blank) {
        router.push(`/prayer/${blank.id}`);
        return;
      }
      const res = await fetch("/api/prayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const entry = await res.json();
        router.push(`/prayer/${entry.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Prayer Journal</h1>
        <Button onClick={createEntry} disabled={creating} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Prayer</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="open">
          <TabsList className="mb-6">
            <TabsTrigger value="open">
              Open{open.length ? ` (${open.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="answered">
              Answered{answered.length ? ` (${answered.length})` : ""}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="open">
            <EntryList
              entries={open}
              emptyIcon={HandHeart}
              emptyTitle="No open prayers yet"
              emptyHint="Add one to start your journal."
              onSelect={(id) => router.push(`/prayer/${id}`)}
            />
          </TabsContent>
          <TabsContent value="answered">
            <EntryList
              entries={answered}
              emptyIcon={CheckCircle2}
              emptyTitle="No answered prayers marked yet"
              onSelect={(id) => router.push(`/prayer/${id}`)}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
