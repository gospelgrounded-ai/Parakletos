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
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { FEATURED_TRANSLATIONS } from "@/lib/bible-api";
import { BollsLanguageGroup } from "@/lib/bible-api";

interface TranslationSelectorProps {
  currentTranslation: string;
  book: number;
  chapter: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TranslationSelector({
  currentTranslation,
  book,
  chapter,
}: TranslationSelectorProps) {
  const router = useRouter();
  const { data } = useSWR<{ groups: BollsLanguageGroup[] }>(
    "/api/bible/translations",
    fetcher,
    { revalidateOnFocus: false }
  );

  function handleSelect(value: string) {
    router.push(`/bible/${value}/${book}/${chapter}`);
  }

  // All non-featured translations grouped by language
  const featuredCodes = new Set(FEATURED_TRANSLATIONS.map((t) => t.short_name));
  const otherGroups = (data?.groups ?? [])
    .map((group) => ({
      ...group,
      translations: group.translations.filter((t) => !featuredCodes.has(t.short_name)),
    }))
    .filter((g) => g.translations.length > 0);

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
          {FEATURED_TRANSLATIONS.map((t) => (
            <SelectItem key={t.short_name} value={t.short_name} className="text-sm">
              <span className="font-semibold">{t.short_name}</span>
              <span className="ml-2 text-muted-foreground text-xs">{t.full_name}</span>
            </SelectItem>
          ))}
        </SelectGroup>

        {otherGroups.length > 0 && <SelectSeparator />}

        {otherGroups.map((group) => (
          <SelectGroup key={group.language}>
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
        ))}
      </SelectContent>
    </Select>
  );
}
