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
// allows browser requests (client-side CORS). Only used when the server
// route reports it fell back to Bolls too (see below) — otherwise api.bible
// is the primary source and this never needs to run.
const BOLLS_TRANSLATIONS_URL =
  "https://bolls.life/static/bolls/app/views/languages-and-translations.json";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ApiResponse {
  source: "api.bible" | "bolls";
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
  // Language-name first (works for both providers); KJV-membership as a
  // fallback for oddly-labeled group data. The old KJV-only sentinel broke
  // under api.bible codes and silently substituted the hardcoded list.
  const englishGroup =
    allGroups.find((g) => /^english\b/i.test(g.language)) ??
    allGroups.find((g) => g.translations.some((t) => t.short_name === "KJV"));
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
  // api.bible is the primary source when API_BIBLE_KEY is configured and
  // has at least one Bible attached — the server route decides this (see
  // fetchPrimaryTranslations()) and tells us which one it used.
  const { data: apiData } = useSWR<ApiResponse>(
    "/api/bible/translations",
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  // Bolls.life kept only as a fallback: fired eagerly (so there's no
  // waterfall while apiData is still loading) but only actually used below
  // once we know the server also fell back to Bolls.
  const { data: directRaw, error: directError } = useSWR<unknown>(
    BOLLS_TRANSLATIONS_URL,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  if (apiData?.source === "api.bible") {
    const groups: BollsLanguageGroup[] = [
      { language: "English", translations: apiData.english },
      ...(apiData.groups ?? []),
    ];
    return { ...buildData(groups), isLoaded: true };
  }

  // Server fell back to Bolls (or hasn't responded yet) — prefer the direct
  // browser fetch (more likely to be the full live list) and fall back to
  // the server's own Bolls response, then the hardcoded list.
  if (directRaw && !directError) {
    const directGroups = parseRawGroups(directRaw);
    if (directGroups.length > 0) {
      return { ...buildData(directGroups), isLoaded: true };
    }
  }

  if (apiData?.english) {
    const groups: BollsLanguageGroup[] = [
      { language: "English", translations: apiData.english },
      ...(apiData.groups ?? []),
    ];
    return { ...buildData(groups), isLoaded: true };
  }

  return { ...buildData(FALLBACK_GROUPS), isLoaded: !!(directRaw || apiData) };
}
