import { NextResponse } from "next/server";
import {
  FALLBACK_COMMENTARY_SOURCES,
  listEnglishSources,
} from "@/lib/commentary-format";
import { fetchAvailableCommentaries } from "@/lib/commentary";

/** The English commentary sources available for the Study panel's picker. */
export async function GET() {
  const available = await fetchAvailableCommentaries();

  if (available.length === 0) {
    // Upstream unreachable — serve the known preferred set briefly so the
    // picker still works, and retry the live list soon.
    return NextResponse.json(
      { sources: FALLBACK_COMMENTARY_SOURCES },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  }

  return NextResponse.json(
    { sources: listEnglishSources(available) },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    }
  );
}
