import { NextResponse } from "next/server";
import {
  fetchPrimaryTranslations,
  FEATURED_TRANSLATION_CODES,
  FALLBACK_TRANSLATIONS,
  type BollsTranslation,
} from "@/lib/bible-api";

export async function GET() {
  // api.bible is the primary source (see fetchPrimaryTranslations); Bolls
  // is only used when there's no key, api.bible failed, or the key has zero
  // approved Bibles. `source` tells the client which one it got, since
  // useTranslations() only needs its own direct-to-bolls.life fallback path
  // when the server had to fall back too.
  const { source, groups, stale } = await fetchPrimaryTranslations();

  // Find the English group — identified by containing "KJV"
  const englishGroup = groups.find((g) =>
    g.translations.some((t) => t.short_name === "KJV")
  );
  const englishTranslations: BollsTranslation[] =
    englishGroup?.translations ?? FALLBACK_TRANSLATIONS;

  // Non-English groups
  const otherGroups = groups.filter((g) => g !== englishGroup);

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
    { source, english: sorted, groups: otherGroups },
    {
      headers: {
        "Cache-Control": stale
          ? "public, s-maxage=300"
          : "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    }
  );
}
