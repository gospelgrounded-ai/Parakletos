import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
  );
}

function addDays(date: string, n: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date().toISOString().slice(0, 10);
    const cutoff = addDays(today, -69); // last 70 days

    // Fetch all reading days for the user
    const allDays = await db.dailyReading.findMany({
      where: { userId },
      select: { date: true, chaptersRead: true },
      orderBy: { date: "asc" },
    });

    const dateSet = new Set(allDays.map((d) => d.date));
    const totalDays = allDays.length;

    // Current streak: consecutive days ending today or yesterday
    let currentStreak = 0;
    const readToday = dateSet.has(today);
    let checkDate = readToday ? today : addDays(today, -1);

    while (dateSet.has(checkDate)) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }

    // Longest streak
    let longestStreak = 0;
    let run = 0;
    const sortedDates = allDays.map((d) => d.date).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        run = 1;
      } else if (daysBetween(sortedDates[i - 1], sortedDates[i]) === 1) {
        run++;
      } else {
        longestStreak = Math.max(longestStreak, run);
        run = 1;
      }
    }
    longestStreak = Math.max(longestStreak, run);

    // Last 70 days for heatmap
    const recent = allDays.filter((d) => d.date >= cutoff);
    const last70Days = recent.map((d) => ({
      date: d.date,
      chaptersRead: d.chaptersRead,
    }));

    return NextResponse.json({
      currentStreak,
      longestStreak,
      totalDays,
      readToday,
      last70Days,
    });
  } catch (error) {
    console.error("[STREAK_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
