"use client";

import { use, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import ProgressBar from "@/components/shared/ProgressBar";
import { CheckCircle2, Circle, BookOpen, ArrowLeft, PlayCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getReflectionPrompt } from "@/lib/reflection-prompts";

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
  const { data: userSettings } = useSWR("/api/user/settings", fetcher);
  const translation: string = userSettings?.defaultTranslation || "KJV";
  const [justCompletedDay, setJustCompletedDay] = useState<number | null>(null);

  async function markDayComplete(dayNumber: number) {
    try {
      await fetch(`/api/reading-plans/${planId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber }),
      });
      mutateProgress();
      setJustCompletedDay(dayNumber);
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

  const completedDays = new Set<number>(progress?.completedDays ?? []);
  const currentDay: number = progress?.currentDay ?? 1;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
      <Link
        href="/plans"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Reading Plans
      </Link>

      {/* Plan header — accent strip, never text on the raw cover color */}
      <div className="rounded-xl border bg-card overflow-hidden mb-6">
        <div
          className="h-2"
          style={{ backgroundColor: plan.coverColor ?? "#4F46E5" }}
        />
        <div className="p-6">
          <h1 className="font-serif text-2xl font-bold mb-1">{plan.title}</h1>
          <p className="text-muted-foreground text-sm">{plan.description}</p>
          <div className="mt-4">
            <ProgressBar
              value={(completedDays.size / plan.totalDays) * 100}
            />
            <p className="text-muted-foreground text-xs mt-1">
              {completedDays.size} of {plan.totalDays} days complete
            </p>
          </div>
        </div>
      </div>

      {/* Day list */}
      <div className="space-y-2">
        {(plan.days as PlanDay[])?.map((day) => {
          const passages: Passage[] = JSON.parse(day.passages);
          const isComplete = completedDays.has(day.dayNumber);
          const isCurrent = day.dayNumber === currentDay;
          // First passage of this day — used for the "Start reading" button
          const firstPassage = passages[0];

          return (
            <div
              key={day.id}
              className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                isCurrent
                  ? "border-primary/30 bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              {/* Complete toggle */}
              <button
                onClick={() => !isComplete && markDayComplete(day.dayNumber)}
                className="mt-0.5 flex-shrink-0"
                aria-label={isComplete ? `Day ${day.dayNumber} complete` : `Mark day ${day.dayNumber} complete`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1.5">
                  Day {day.dayNumber}
                  {isCurrent && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Today
                    </span>
                  )}
                </p>

                {/* Individual passage links */}
                <div className="flex flex-wrap gap-2">
                  {passages.map((p, i) => {
                    const bookInfo = BIBLE_BOOKS.find((b) => b.id === p.book);
                    const href = `/bible/${translation}/${p.book}/${p.chapter}?planId=${planId}&day=${day.dayNumber}&passage=${i}`;
                    return (
                      <Link
                        key={i}
                        href={href}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <BookOpen className="h-3 w-3" />
                        {bookInfo?.shortName ?? p.book} {p.chapter}
                      </Link>
                    );
                  })}
                </div>

                {/* Reflection prompt — shown right after marking a day complete */}
                {isComplete && justCompletedDay === day.dayNumber && (
                  <div className="mt-3 rounded-lg bg-primary/5 border border-primary/10 p-3">
                    <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Reflect
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {getReflectionPrompt(day.dayNumber)}
                    </p>
                  </div>
                )}
              </div>

              {/* "Start reading" CTA for the current day */}
              {isCurrent && !isComplete && firstPassage && (
                <Link
                  href={`/bible/${translation}/${firstPassage.book}/${firstPassage.chapter}?planId=${planId}&day=${day.dayNumber}&passage=0`}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Read
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
