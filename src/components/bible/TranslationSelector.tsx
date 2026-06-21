"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Languages } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FEATURED_TRANSLATION_CODES,
  FALLBACK_TRANSLATIONS,
  type BollsTranslation,
  type BollsLanguageGroup,
} from "@/lib/bible-api";

interface TranslationSelectorProps {
  currentTranslation: string;
  book: number;
  chapter: number;
  extraSearch?: string;
}

interface TranslationsResponse {
  english: BollsTranslation[];
  groups: BollsLanguageGroup[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const featuredSet = new Set(FEATURED_TRANSLATION_CODES);

export default function TranslationSelector({
  currentTranslation,
  book,
  chapter,
  extraSearch,
}: TranslationSelectorProps) {
  const router = useRouter();
  const { data } = useSWR<TranslationsResponse>(
    "/api/bible/translations",
    fetcher,
    { revalidateOnFocus: false }
  );

  const english = data?.english ?? FALLBACK_TRANSLATIONS;
  const groups = data?.groups ?? [];

  // Popular = featured codes that actually exist in the API response (in order)
  const popular = FEATURED_TRANSLATION_CODES
    .map((code) => english.find((t) => t.short_name === code))
    .filter((t): t is BollsTranslation => t !== undefined);

  // Everything else English that isn't in our preferred list
  const moreEnglish = english.filter((t) => !featuredSet.has(t.short_name));

  function handleSelect(value: string) {
    const base = `/bible/${value}/${book}/${chapter}`;
    router.push(extraSearch ? `${base}?${extraSearch}` : base);
  }

  return (
    <Select value={currentTranslation} onValueChange={handleSelect}>
      <SelectTrigger
        className="h-8 w-auto min-w-[60px] max-w-[90px] border-0 bg-muted/50 hover:bg-muted text-xs font-semibold tracking-wide focus:ring-1 px-2"
        aria-label="Select Bible translation"
      >
        <Languages className="h-3 w-3 mr-1 shrink-0 text-muted-foreground" />
        <SelectValue placeholder={currentTranslation} />
      </SelectTrigger>

      <SelectContent className="max-h-[400px]">
        <SelectGroup>
          <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wider px-2 py-1.5">
            Popular
          </SelectLabel>
          {popular.map((t) => (
            <SelectItem key={t.short_name} value={t.short_name} className="text-sm">
              <span className="font-semibold">{t.short_name}</span>
              <span className="ml-2 text-muted-foreground text-xs">{t.full_name}</span>
            </SelectItem>
          ))}
        </SelectGroup>

        {moreEnglish.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                More English
              </SelectLabel>
              {moreEnglish.map((t) => (
                <SelectItem key={t.short_name} value={t.short_name} className="text-sm">
                  <span className="font-semibold">{t.short_name}</span>
                  <span className="ml-2 text-muted-foreground text-xs">{t.full_name}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}

        {groups.map((group) => (
          group.translations.length > 0 && (
            <span key={group.language}>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                  {group.language}
                </SelectLabel>
                {group.translations.map((t) => (
                  <SelectItem key={t.short_name} value={t.short_name} className="text-sm">
                    <span className="font-semibold">{t.short_name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">{t.full_name}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </span>
          )
        ))}
      </SelectContent>
    </Select>
  );
}
