import { NextResponse } from "next/server";
import { fetchStrongsChapter, parseStrongs } from "@/lib/bible-api";
import lexiconData from "@/data/strongs-lexicon.json";

// Strong's Greek & Hebrew lexicon (Open Scriptures, CC-BY-SA).
// Keyed "G1722" / "H7225" → { lemma, translit?, pron?, def?, kjv?, deriv? }
interface LexEntry {
  lemma?: string;
  translit?: string;
  pron?: string;
  def?: string;
  kjv?: string;
  deriv?: string;
}
const LEXICON = lexiconData as Record<string, LexEntry>;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const book = Number(searchParams.get("book"));
  const chapter = Number(searchParams.get("chapter"));
  const verse = Number(searchParams.get("verse"));

  if (!book || !chapter || !verse) {
    return NextResponse.json({ words: [] });
  }

  const testament: "OT" | "NT" = book <= 39 ? "OT" : "NT";

  let rawText = "";
  try {
    const verses = await fetchStrongsChapter(book, chapter);
    rawText = verses.find((v) => v.verse === verse)?.text ?? "";
  } catch {
    return NextResponse.json({ words: [], error: "fetch_failed" });
  }

  const tokens = parseStrongs(rawText, testament);

  // Keep only words that carry a Strong's number, attach lexicon data.
  const words = tokens
    .filter((t) => t.strongs.length > 0)
    .map((t) => {
      const strongs = t.strongs[0];
      const entry = LEXICON[strongs];
      return {
        word: t.word,
        strongs,
        lemma: entry?.lemma ?? null,
        translit: entry?.translit ?? null,
        pron: entry?.pron ?? null,
        definition: entry?.def ?? null,
        kjvDef: entry?.kjv ?? null,
        derivation: entry?.deriv ?? null,
      };
    });

  return NextResponse.json(
    { words, language: testament === "OT" ? "Hebrew" : "Greek" },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    }
  );
}
