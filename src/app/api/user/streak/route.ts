import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { addDays, computeStreak } from "@/lib/streak";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date().toISOString().slice(0, 10);
    const cutoff = addDays(today, -69); // last 70 days

    const allDays = await db.dailyReading.findMany({
      where: { userId },
      select: { date: true, chaptersRead: true },
      orderBy: { date: "asc" },
    });

    const { currentStreak, longestStreak, totalDays, readToday } = computeStreak(
      allDays.map((d) => d.date),
      today
    );

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
