import { NextResponse } from "next/server";
import { fetchStrongsChapter, parseStrongs } from "@/lib/bible-api";
import lexiconData from "@/data/strongs-lexicon.json";

interface LexEntry {
  lemma?: string;
  translit?: string;
  def?: string;
}
const LEXICON = lexiconData as Record<string, LexEntry>;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const book = Number(searchParams.get("book"));
  const chapter = Number(searchParams.get("chapter"));

  if (!book || !chapter || book < 1 || book > 66 || chapter < 1) {
    return NextResponse.json(
      { error: "Valid book and chapter are required" },
      { status: 400 }
    );
  }

  const testament: "OT" | "NT" = book <= 39 ? "OT" : "NT";

  try {
    const rawVerses = await fetchStrongsChapter(book, chapter);

    const verses = rawVerses.map((v) => {
      const allTokens = parseStrongs(v.text, testament);

      const tokens = allTokens
        .filter((t) => t.word.length > 0)
        .map((token) => {
          const strongsId = token.strongs[0] ?? null;
          const entry = strongsId ? LEXICON[strongsId] : null;
          // Trim definition to first phrase (before ; or ,) and cap at 32 chars
          const rawDef = entry?.def ?? null;
          const shortDef = rawDef
            ? rawDef.split(/[;,]/)[0].trim().slice(0, 32)
            : null;
          return {
            word: token.word,
            strongs: strongsId,
            lemma: entry?.lemma ?? null,
            translit: entry?.translit ?? null,
            definition: shortDef,
          };
        });

      return { verse: v.verse, tokens };
    });

    return NextResponse.json(
      { verses, language: testament === "OT" ? "Hebrew" : "Greek" },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch interlinear data" },
      { status: 500 }
    );
  }
}
