import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { BibleBook } from "@/lib/bible-books";
import {
  extractText,
  type CommentaryPayload,
  type CommentarySourceInfo,
  type ContentItem,
  type HellaoCommentary,
} from "@/lib/commentary-format";

/**
 * Server-side commentary pipeline: bible.helloao.org fetches with a
 * Postgres read-through cache per (commentaryId, book, chapter), mirroring
 * ChapterCache in bible-api.ts. Cache failures never affect responses.
 */

const HELLOAO_BASE = "https://bible.helloao.org";
const FETCH_OPTS = { next: { revalidate: 86400 } } as const;

interface HellaoBook {
  id: string;
  commonName: string;
  order: number;
  numberOfChapters: number;
}

interface HellaoVerseEntry {
  type: "verse";
  number: number;
  content: ContentItem[];
}

interface HellaoChapterData {
  number: number;
  introduction?: string | null;
  content: HellaoVerseEntry[];
}

export interface CommentaryEntry extends CommentaryPayload {
  id: string;
  name: string;
}

export interface SourceChapterResult {
  entry: CommentaryEntry | null;
  /** Upstream failed AND nothing cached — a retryable error condition. */
  failed: boolean;
  /** Entry served from the DB cache because upstream failed. */
  stale: boolean;
}

/** Available commentaries; [] on failure (callers fall back to known ids). */
export async function fetchAvailableCommentaries(): Promise<HellaoCommentary[]> {
  try {
    const res = await fetch(`${HELLOAO_BASE}/api/available_commentaries.json`, FETCH_OPTS);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.commentaries ?? []) as HellaoCommentary[];
  } catch {
    return [];
  }
}

// The next two throw on network/HTTP failure — distinguishing an outage
// from genuine no-content is the whole point (the old route swallowed
// everything into empty arrays, so the UI couldn't tell the difference).

async function fetchCommentaryBooks(commentaryId: string): Promise<HellaoBook[]> {
  const res = await fetch(`${HELLOAO_BASE}/api/c/${commentaryId}/books.json`, FETCH_OPTS);
  if (!res.ok) throw new Error(`helloao books.json failed: ${res.status}`);
  const data = await res.json();
  return (data.books ?? []) as HellaoBook[];
}

async function fetchCommentaryChapter(
  commentaryId: string,
  bookId: string,
  chapter: number
): Promise<HellaoChapterData | null> {
  const res = await fetch(
    `${HELLOAO_BASE}/api/c/${commentaryId}/${bookId}/${chapter}.json`,
    FETCH_OPTS
  );
  // 404 here means "this commentary has no such chapter" — no-content, not
  // an outage.
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`helloao chapter fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.chapter ?? null) as HellaoChapterData | null;
}

/**
 * Fetch one source's chapter with read-through caching:
 * - success → upsert cache, return fresh entry
 * - genuine no-content (book/chapter absent from this commentary) → null
 *   entry, not an error
 * - upstream failure → serve last cached copy (stale) if any, else failed
 */
export async function fetchSourceChapter(
  source: CommentarySourceInfo,
  book: number,
  bookInfo: BibleBook,
  chapter: number
): Promise<SourceChapterResult> {
  try {
    const books = await fetchCommentaryBooks(source.id);

    // Match by order (1-indexed book number) or by common name
    const bookEntry =
      books.find((b) => b.order === book) ??
      books.find(
        (b) =>
          b.commonName.toLowerCase() === bookInfo.name.toLowerCase() ||
          b.commonName.toLowerCase() === bookInfo.shortName.toLowerCase()
      );
    if (!bookEntry) return { entry: null, failed: false, stale: false };

    const chapterData = await fetchCommentaryChapter(source.id, bookEntry.id, chapter);
    if (!chapterData) return { entry: null, failed: false, stale: false };

    const verses = chapterData.content
      .filter((c) => c.type === "verse")
      .map((c) => ({ verse: c.number, text: extractText(c.content) }))
      .filter((v) => v.text.length > 10);

    if (verses.length === 0 && !chapterData.introduction) {
      return { entry: null, failed: false, stale: false };
    }

    const payload: CommentaryPayload = {
      introduction: chapterData.introduction ?? null,
      verses,
    };

    await db.commentaryCache
      .upsert({
        where: {
          commentaryId_book_chapter: { commentaryId: source.id, book, chapter },
        },
        create: {
          commentaryId: source.id,
          book,
          chapter,
          name: source.name,
          payload: payload as unknown as Prisma.InputJsonValue,
        },
        update: {
          name: source.name,
          payload: payload as unknown as Prisma.InputJsonValue,
          fetchedAt: new Date(),
        },
      })
      .catch(() => {});

    return { entry: { id: source.id, name: source.name, ...payload }, failed: false, stale: false };
  } catch {
    const cached = await db.commentaryCache
      .findUnique({
        where: {
          commentaryId_book_chapter: { commentaryId: source.id, book, chapter },
        },
      })
      .catch(() => null);
    if (cached) {
      const payload = cached.payload as unknown as CommentaryPayload;
      return {
        entry: { id: source.id, name: cached.name || source.name, ...payload },
        failed: false,
        stale: true,
      };
    }
    return { entry: null, failed: true, stale: false };
  }
}
