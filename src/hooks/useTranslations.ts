"use client";

import useSWR from "swr";
import {
  FEATURED_TRANSLATION_CODES,
  FALLBACK_TRANSLATIONS,
  FALLBACK_GROUPS,
  type BollsTranslation,
  type BollsLanguageGroup,
} from "@/lib/bible-api";

// Direct browser fetch — Bolls.life blocks server-to-server requests but
// allows browser requests (client-side CORS). This gives us the real list.
const BOLLS_TRANSLATIONS_URL =
  "https://bolls.life/static/bolls/app/views/languages-and-translations.json";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ApiResponse {
  english: BollsTranslation[];
  groups: BollsLanguageGroup[];
}

function parseRawGroups(data: unknown): BollsLanguageGroup[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as BollsLanguageGroup[];
  if (typeof data === "object") {
    return Object.entries(data as Record<string, BollsTranslation[]>).map(
      ([language, translations]) => ({ language, translations: translations ?? [] })
    );
  }
  return [];
}

export interface TranslationsData {
  /** All English translations sorted: featured first, then alphabetical. */
  english: BollsTranslation[];
  /** Featured codes that actually exist in the live data, in declared order. */
  popular: BollsTranslation[];
  /** Non-English language groups. */
  groups: BollsLanguageGroup[];
  isLoaded: boolean;
}

const preferredRank = new Map(
  FEATURED_TRANSLATION_CODES.map((code, i) => [code, i])
);

function buildData(allGroups: BollsLanguageGroup[]): Omit<TranslationsData, "isLoaded"> {
  const englishGroup = allGroups.find((g) =>
    g.translations.some((t) => t.short_name === "KJV")
  );
  const english = englishGroup?.translations ?? FALLBACK_TRANSLATIONS;
  const otherGroups = allGroups.filter((g) => g !== englishGroup);

  const sortedEnglish = [...english].sort((a, b) => {
    const ai = preferredRank.get(a.short_name) ?? Infinity;
    const bi = preferredRank.get(b.short_name) ?? Infinity;
    if (ai !== bi) return ai - bi;
    return a.short_name.localeCompare(b.short_name);
  });

  const popular = FEATURED_TRANSLATION_CODES
    .map((code) => sortedEnglish.find((t) => t.short_name === code))
    .filter((t): t is BollsTranslation => t !== undefined);

  return { english: sortedEnglish, popular, groups: otherGroups };
}

/** Union two group sets by language, deduping by short_name (first set wins). */
function mergeGroups(
  primary: BollsLanguageGroup[],
  extra: BollsLanguageGroup[]
): BollsLanguageGroup[] {
  const seen = new Set(
    primary.flatMap((g) => g.translations.map((t) => t.short_name.toUpperCase()))
  );
  const merged = primary.map((g) => ({ ...g, translations: [...g.translations] }));
  for (const g of extra) {
    for (const t of g.translations) {
      const code = t.short_name.toUpperCase();
      if (seen.has(code)) continue;
      seen.add(code);
      let group = merged.find((mg) => mg.language === g.language);
      if (!group) {
        group = { language: g.language, translations: [] };
        merged.push(group);
      }
      group.translations.push(t);
    }
  }
  return merged;
}

export function useTranslations(): TranslationsData {
  // 1. Try browser-direct fetch from Bolls.life (full live list, all languages)
  const { data: directRaw, error: directError } = useSWR<unknown>(
    BOLLS_TRANSLATIONS_URL,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // 2. Always fetch our server-side route too — not just as a Bolls
  // fallback, but because it's the only source for any translations layered
  // in from api.bible (API_BIBLE_KEY), which bolls.life has no knowledge of.
  const { data: apiData } = useSWR<ApiResponse>(
    "/api/bible/translations",
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const apiGroups: BollsLanguageGroup[] | null = apiData?.english
    ? [{ language: "English", translations: apiData.english }, ...(apiData.groups ?? [])]
    : null;

  if (directRaw && !directError) {
    const directGroups = parseRawGroups(directRaw);
    if (directGroups.length > 0) {
      const groups = apiGroups ? mergeGroups(directGroups, apiGroups) : directGroups;
      return { ...buildData(groups), isLoaded: true };
    }
  }

  if (apiGroups) {
    return { ...buildData(apiGroups), isLoaded: true };
  }

  // 3. Comprehensive hardcoded fallback
  return { ...buildData(FALLBACK_GROUPS), isLoaded: !!(directRaw || apiData) };
}
