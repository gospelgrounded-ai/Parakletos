import { NextResponse } from "next/server";
import {
  fetchTranslations,
  FEATURED_TRANSLATION_CODES,
  FALLBACK_TRANSLATIONS,
  FALLBACK_GROUPS,
  type BollsTranslation,
} from "@/lib/bible-api";

export async function GET() {
  try {
    const rawGroups = await fetchTranslations();

    // Find the English group — identified by containing "KJV"
    const englishGroup = rawGroups.find((g) =>
      g.translations.some((t) => t.short_name === "KJV")
    );
    const englishTranslations: BollsTranslation[] =
      englishGroup?.translations ?? FALLBACK_TRANSLATIONS;

    // Non-English groups
    const otherGroups = rawGroups.filter((g) => g !== englishGroup);

    // Sort English: preferred codes first (in declared order), then alphabetical
    const preferredRank = new Map(
      FEATURED_TRANSLATION_CODES.map((code, i) => [code, i])
    );
    const sorted = [...englishTranslations].sort((a, b) => {
      const ai = preferredRank.get(a.short_name) ?? Infinity;
      const bi = preferredRank.get(b.short_name) ?? Infinity;
      if (ai !== bi) return ai - bi;
      return a.short_name.localeCompare(b.short_name);
    });

    return NextResponse.json(
      { english: sorted, groups: otherGroups },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    const fallbackEnglish = FALLBACK_TRANSLATIONS;
    const fallbackGroups = FALLBACK_GROUPS.filter((g) => g.language !== "English");
    return NextResponse.json(
      { english: fallbackEnglish, groups: fallbackGroups },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  }
}
