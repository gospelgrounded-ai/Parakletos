"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import { CheckCircle2, Circle, BookOpen, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PlanDay {
  id: string;
  dayNumber: number;
  title?: string;
  passages: string; // JSON string
}

interface Passage {
  book: number;
  chapter: number;
}

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = use(params);
  const { data: plan, isLoading } = useSWR(`/api/reading-plans/${planId}`, fetcher);
  const { data: progress, mutate: mutateProgress } = useSWR(
    `/api/reading-plans/${planId}/progress`,
    fetcher
  );

  async function markDayComplete(dayNumber: number) {
    try {
      await fetch(`/api/reading-plans/${planId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber }),
      });
      mutateProgress();
      toast.success(`Day ${dayNumber} marked complete!`);
    } catch {
      toast.error("Failed to update progress");
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!plan) return null;

  const completedDays = new Set<number>(
    progress?.completedDays ?? []
  );
  const currentDay = progress?.currentDay ?? 1;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
      <Link
        href="/plans"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Reading Plans
      </Link>

      <div
        className="rounded-xl p-6 text-white mb-6"
        style={{ backgroundColor: plan.coverColor ?? "#4F46E5" }}
      >
        <h1 className="font-serif text-2xl font-bold mb-1">{plan.title}</h1>
        <p className="text-white/80 text-sm">{plan.description}</p>
        <div className="mt-4">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${(completedDays.size / plan.totalDays) * 100}%` }}
            />
          </div>
          <p className="text-white/80 text-xs mt-1">
            {completedDays.size} of {plan.totalDays} days complete
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {(plan.days as PlanDay[])?.map((day) => {
          const passages: Passage[] = JSON.parse(day.passages);
          const isComplete = completedDays.has(day.dayNumber);
          const isCurrent = day.dayNumber === currentDay;

          return (
            <div
              key={day.id}
              className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                isCurrent
                  ? "border-primary/30 bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <button
                onClick={() => !isComplete && markDayComplete(day.dayNumber)}
                className="mt-0.5 flex-shrink-0"
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Day {day.dayNumber}
                  {isCurrent && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Today
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {passages.map((p, i) => {
                    const book = BIBLE_BOOKS.find((b) => b.id === p.book);
                    return (
                      <Link
                        key={i}
                        href={`/bible/KJV/${p.book}/${p.chapter}`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <BookOpen className="h-3 w-3" />
                        {book?.shortName ?? p.book} {p.chapter}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
