export type MaskMode = "full" | "hint" | "blank";

/** Progressive word-hiding for verse memorization practice. */
export function maskVerseText(text: string, mode: MaskMode): string {
  if (mode === "full") return text;
  return text
    .split(" ")
    .map((word) => maskWord(word, mode))
    .join(" ");
}

function maskWord(word: string, mode: MaskMode): string {
  const match = word.match(/^(\W*)([\w']*)(\W*)$/);
  if (!match) return word;
  const [, lead, core, trail] = match;
  if (!core) return word;
  if (mode === "hint") {
    return lead + core[0] + "_".repeat(Math.max(core.length - 1, 0)) + trail;
  }
  return lead + "_".repeat(core.length) + trail;
}
