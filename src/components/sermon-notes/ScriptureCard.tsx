"use client";

import Link from "next/link";
import useSWR from "swr";
import { cleanVerseText } from "@/lib/bible-api";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight } from "lucide-react";
import type { DetectedRef } from "@/lib/detect-scriptures";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Props {
  scripture: DetectedRef;
  translation?: string;
}

export default function ScriptureCard({ scripture, translation = "KJV" }: Props) {
  const { data, isLoading } = useSWR(
    `/api/bible/${translation}/${scripture.book}/${scripture.chapter}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const verses: Array<{ verse: number; text: string }> = data?.verses ?? [];

  let verseText: string | null = null;
  if (scripture.verse !== null) {
    const v = verses.find((v) => v.verse === scripture.verse);
    if (v) verseText = cleanVerseText(v.text);
  } else if (verses.length > 0) {
    verseText = cleanVerseText(verses[0].text);
  }

  const href = `/bible/${translation}/${scripture.book}/${scripture.chapter}${
    scripture.verse ? `#v${scripture.verse}` : ""
  }`;

  return (
    <Link
      href={href}
      className="block rounded-lg border bg-card hover:bg-muted/30 transition-colors p-3 group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-primary">{scripture.display}</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {isLoading ? (
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
        </div>
      ) : verseText ? (
        <p className="text-sm font-serif leading-relaxed text-foreground/75 italic line-clamp-3">
          &ldquo;{verseText}&rdquo;
        </p>
      ) : null}

      <p className="text-[10px] text-muted-foreground mt-1.5">{translation}</p>
    </Link>
  );
}
