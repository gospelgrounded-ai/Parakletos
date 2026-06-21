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

export function useTranslations(): TranslationsData {
  // 1. Try browser-direct fetch from Bolls.life (full live list, all languages)
  const { data: directRaw, error: directError } = useSWR<unknown>(
    BOLLS_TRANSLATIONS_URL,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // 2. Try our server-side proxy (may also be blocked, but worth trying)
  const { data: apiData } = useSWR<ApiResponse>(
    directError !== undefined ? "/api/bible/translations" : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  if (directRaw && !directError) {
    const groups = parseRawGroups(directRaw);
    if (groups.length > 0) {
      return { ...buildData(groups), isLoaded: true };
    }
  }

  if (apiData?.english) {
    const groups: BollsLanguageGroup[] = [
      { language: "English", translations: apiData.english },
      ...(apiData.groups ?? []),
    ];
    return { ...buildData(groups), isLoaded: true };
  }

  // 3. Comprehensive hardcoded fallback
  return { ...buildData(FALLBACK_GROUPS), isLoaded: !!(directRaw || apiData) };
}
