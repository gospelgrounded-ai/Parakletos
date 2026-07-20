import { NextResponse } from "next/server";
import { getBook } from "@/lib/bible-books";
import {
  FALLBACK_COMMENTARY_SOURCES,
  listEnglishSources,
  normalizeSourcesParam,
  selectDefaultSources,
  type CommentarySourceInfo,
} from "@/lib/commentary-format";
import { fetchAvailableCommentaries, fetchSourceChapter } from "@/lib/commentary";

const FRESH_CACHE = "public, s-maxage=86400, stale-while-revalidate=3600";
const STALE_CACHE = "public, s-maxage=300";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const book = Number(searchParams.get("book"));
  const chapter = Number(searchParams.get("chapter"));

  const bookInfo = Number.isInteger(book) ? getBook(book) : undefined;
  if (!bookInfo || !Number.isInteger(chapter) || chapter < 1 || chapter > bookInfo.chapters) {
    return NextResponse.json(
      { commentaries: [], error: "invalid_params" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const available = await fetchAvailableCommentaries();

  // Resolve which sources to fetch. When the available list itself is down,
  // fall back to the known preferred ids — the DB cache may still satisfy
  // them, so an empty list must never dead-end the request.
  const availableSources: CommentarySourceInfo[] =
    available.length > 0 ? listEnglishSources(available) : FALLBACK_COMMENTARY_SOURCES;

  const requestedIds = normalizeSourcesParam(
    searchParams.get("sources"),
    availableSources.map((s) => s.id)
  );

  const sources: CommentarySourceInfo[] = requestedIds
    ? requestedIds
        .map((id) => availableSources.find((s) => s.id === id))
        .filter((s): s is CommentarySourceInfo => s !== undefined)
    : available.length > 0
    ? selectDefaultSources(available).map((c) => ({ id: c.id, name: c.englishName || c.name }))
    : FALLBACK_COMMENTARY_SOURCES.slice(0, 3);

  const results = await Promise.all(
    sources.map((source) => fetchSourceChapter(source, book, bookInfo, chapter))
  );

  const commentaries = results
    .map((r) => r.entry)
    .filter((e): e is NonNullable<typeof e> => e !== null);
  const anyStale = results.some((r) => r.stale);
  const anyFailed = results.some((r) => r.failed);

  if (commentaries.length === 0 && anyFailed) {
    // Transient outage with nothing cached — must NOT be CDN-cached, or the
    // error would be pinned for a day and Retry couldn't re-hit upstream.
    return NextResponse.json(
      { commentaries: [], error: "fetch_failed" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      commentaries,
      ...(anyStale ? { stale: true } : {}),
    },
    { headers: { "Cache-Control": anyStale ? STALE_CACHE : FRESH_CACHE } }
  );
}
