/**
 * Pure verse-text helpers — deliberately dependency-free so provider modules
 * (and their unit tests) can import them without pulling in the Prisma
 * client via @/lib/bible-api → @/lib/db.
 */

/**
 * Some bolls.life translations (notably KJV and ASV) are served as the
 * Strong's-tagged variant, so verse text contains inline markup:
 *   - <S>1722</S>  Strong's concordance numbers
 *   - <sup>...</sup>  translator footnotes
 *   - <i>was</i>  italicized supplied words
 * api.bible chapter HTML carries its own tags (<p>, <span>, notes).
 * Strip the numbers and notes, keep the readable words, tidy whitespace.
 */
export function cleanVerseText(raw: string): string {
  return raw
    .replace(/<S>.*?<\/S>/g, "") // Strong's numbers (remove with content)
    .replace(/<sup>.*?<\/sup>/g, "") // translator footnotes (remove with content)
    .replace(/<[^>]+>/g, "") // any remaining tags (<i>, <b>, <br/>) — keep inner text
    .replace(/\s+/g, " ") // collapse whitespace left behind
    .replace(/\s+([,.;:!?’”)])/g, "$1") // tidy stray space before punctuation
    .trim();
}
