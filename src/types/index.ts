export interface BibleVerse {
  pk: number;
  verse: number;
  text: string;
}

export interface Translation {
  short_name: string;
  full_name: string;
  language: string;
}

export interface UserHighlight {
  id: string;
  verse: number;
  color: HighlightColor;
}

export interface UserBookmark {
  id: string;
  verse: number;
  label?: string | null;
}

export interface UserNote {
  id: string;
  verse: number;
  content: string;
}

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";

export const HIGHLIGHT_COLORS: { color: HighlightColor; label: string; bg: string; border: string }[] = [
  { color: "yellow", label: "Yellow", bg: "bg-yellow-200", border: "border-yellow-400" },
  { color: "green", label: "Green", bg: "bg-green-200", border: "border-green-400" },
  { color: "blue", label: "Blue", bg: "bg-blue-200", border: "border-blue-400" },
  { color: "pink", label: "Pink", bg: "bg-pink-200", border: "border-pink-400" },
  { color: "purple", label: "Purple", bg: "bg-purple-200", border: "border-purple-400" },
];

export function getHighlightClass(color: HighlightColor): string {
  const map: Record<HighlightColor, string> = {
    yellow: "bg-yellow-200/70 dark:bg-yellow-400/30",
    green: "bg-green-200/70 dark:bg-green-400/30",
    blue: "bg-blue-200/70 dark:bg-blue-400/30",
    pink: "bg-pink-200/70 dark:bg-pink-400/30",
    purple: "bg-purple-200/70 dark:bg-purple-400/30",
  };
  return map[color];
}

export interface ReadingPosition {
  translation: string;
  book: number;
  chapter: number;
  verse?: number;
}
