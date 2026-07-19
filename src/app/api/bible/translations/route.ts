import { NextResponse } from "next/server";
import {
  fetchTranslations,
  mergeScriptureApiTranslations,
  FEATURED_TRANSLATION_CODES,
  FALLBACK_TRANSLATIONS,
  FALLBACK_GROUPS,
  type BollsLanguageGroup,
  type BollsTranslation,
} from "@/lib/bible-api";

export async function GET() {
  // Bolls.life sometimes blocks server-to-server requests (client-side CORS
  // still works — see useTranslations.ts), so a Bolls failure here falls
  // back to a hardcoded list. Either way, api.bible must still be merged in
  // — a Bolls outage on the server shouldn't also hide api.bible results.
  let rawGroups: BollsLanguageGroup[];
  let usingFallback = false;
  try {
    rawGroups = await fetchTranslations();
  } catch {
    rawGroups = FALLBACK_GROUPS;
    usingFallback = true;
  }

  const groups = await mergeScriptureApiTranslations(rawGroups);

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
    { english: sorted, groups: otherGroups },
    {
      headers: {
        "Cache-Control": usingFallback
          ? "public, s-maxage=300"
          : "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    }
  );
}
