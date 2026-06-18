"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useReadingProgress() {
  const { data, error, isLoading } = useSWR("/api/user/progress", fetcher);
  return { progress: data, error, isLoading };
}

export async function saveReadingProgress(
  translation: string,
  book: number,
  chapter: number,
  verse?: number
) {
  await fetch("/api/user/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ translation, book, chapter, verse: verse ?? 1 }),
  });
}
