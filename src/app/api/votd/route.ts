import { NextResponse } from "next/server";
import { getVerseOfTheDay } from "@/lib/votd";

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawTranslation = searchParams.get("translation") || "KJV";
  const translation = rawTranslation.length <= 10 ? rawTranslation.toUpperCase() : "KJV";

  const votd = await getVerseOfTheDay(translation);
  if (!votd) {
    return NextResponse.json({ error: "Verse of the day unavailable" }, { status: 503 });
  }

  return NextResponse.json(votd, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
