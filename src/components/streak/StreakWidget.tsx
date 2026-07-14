"use client";

import useSWR from "swr";
import { Flame, Trophy, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  readToday: boolean;
  last70Days: { date: string; chaptersRead: number }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function buildHeatmapGrid(
  last70Days: { date: string; chaptersRead: number }[]
): Array<{ date: string; count: number } | null>[] {
  const readMap = new Map(last70Days.map((d) => [d.date, d.chaptersRead]));

  // Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build 70-day array starting from 69 days ago → today
  const days: { date: string; count: number }[] = [];
  for (let i = 69; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({ date: dateStr, count: readMap.get(dateStr) ?? 0 });
  }

  // Pad the front so the first day starts on Sunday
  const firstDayOfWeek = new Date(days[0].date).getUTCDay(); // 0=Sun
  const padded: Array<{ date: string; count: number } | null>[] = [];
  const flat: Array<{ date: string; count: number } | null> = [
    ...Array(firstDayOfWeek).fill(null),
    ...days,
  ];

  // Split into weeks of 7
  for (let i = 0; i < flat.length; i += 7) {
    padded.push(flat.slice(i, i + 7));
  }

  return padded;
}

function cellColor(count: number, readToday: boolean, isToday: boolean): string {
  if (count === 0) {
    return isToday && !readToday
      ? "bg-primary/20 ring-1 ring-primary/40" // today but not yet read
      : "bg-muted";
  }
  if (count >= 5) return "bg-primary";
  if (count >= 3) return "bg-primary/80";
  if (count >= 2) return "bg-primary/60";
  return "bg-primary/40";
}

export default function StreakWidget() {
  const { data } = useSWR<StreakData>("/api/user/streak", fetcher, {
    revalidateOnFocus: true,
  });

  if (!data) {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
        <div className="h-5 bg-muted rounded" />
        <div className="h-28 bg-muted rounded-xl" />
      </div>
    );
  }

  const { currentStreak, longestStreak, totalDays, readToday, last70Days } = data;
  const weeks = buildHeatmapGrid(last70Days);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Compact streak row — status, not the page's hero */}
      <div className="px-4 py-3 flex items-center gap-3">
        <Flame
          className={cn(
            "h-5 w-5 shrink-0",
            currentStreak > 0
              ? readToday
                ? "text-orange-500"
                : "text-orange-400/60"
              : "text-muted-foreground/40"
          )}
          strokeWidth={2}
        />
        <p className="text-sm font-semibold">
          {currentStreak}-day streak
          <span className="font-normal text-muted-foreground ml-2">
            {readToday
              ? "You've read today"
              : currentStreak > 0
              ? "Read today to keep it going"
              : "Start by reading today"}
          </span>
        </p>
        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground shrink-0">
          <span className="flex items-center gap-1" title="Longest streak">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            {longestStreak}
          </span>
          <span className="flex items-center gap-1" title="Total days read">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {totalDays}
          </span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="px-4 py-4 border-t">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Last 10 weeks
        </p>

        {/* Day of week labels */}
        <div className="flex gap-1 mb-1 pl-0">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="w-7 text-center text-[10px] text-muted-foreground/60"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid — columns = days of week, rows = weeks */}
        <div className="flex gap-1">
          {Array.from({ length: 7 }, (_, dayIdx) => (
            <div key={dayIdx} className="flex flex-col gap-1">
              {weeks.map((week, weekIdx) => {
                const cell = week[dayIdx] ?? null;
                if (!cell) {
                  return <div key={weekIdx} className="w-7 h-7 rounded-md" />;
                }
                const isToday = cell.date === today;
                return (
                  <div
                    key={weekIdx}
                    title={`${cell.date}: ${cell.count} chapter${cell.count !== 1 ? "s" : ""}`}
                    className={cn(
                      "w-7 h-7 rounded-md transition-colors",
                      cellColor(cell.count, readToday, isToday)
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "w-3.5 h-3.5 rounded-sm",
                level === 0
                  ? "bg-muted"
                  : level === 1
                  ? "bg-primary/40"
                  : level === 2
                  ? "bg-primary/60"
                  : level === 3
                  ? "bg-primary/80"
                  : "bg-primary"
              )}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}
