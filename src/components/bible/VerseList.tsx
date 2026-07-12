import { getBook } from "@/lib/bible-books";
import { getSectionHeading, isParagraphStart, stripParagraphMark } from "@/lib/bible-structure";
import { BibleVerse } from "@/types";
import VerseItem from "./VerseItem";

interface VerseListProps {
  verses: BibleVerse[];
  translation: string;
  book: number;
  chapter: number;
  highlights: Map<number, { id: string; color: string }>;
  bookmarks: Set<number>;
  notes: Map<number, { id: string; content: string }>;
  selectedVerse: number | null;
  rangeEnd?: number | null;
  readingVerse?: number | null;
  onVerseClick: (verse: number) => void;
}

interface VerseGroup {
  heading: string | null;
  verses: Array<BibleVerse & { cleanText: string }>;
}

function buildVerseGroups(
  verses: BibleVerse[],
  book: number,
  chapter: number
): VerseGroup[] {
  const groups: VerseGroup[] = [];
  let current: VerseGroup = { heading: null, verses: [] };

  for (const verse of verses) {
    const hasPara = isParagraphStart(verse.text);
    const heading = getSectionHeading(book, chapter, verse.verse);
    const cleanText = stripParagraphMark(verse.text);

    // Start a new paragraph block when there's a ¶ or a section heading,
    // but never for the very first verse (it opens the first group).
    const startNew = (hasPara || heading !== null) && verse.verse > 1 && current.verses.length > 0;

    if (startNew) {
      groups.push(current);
      current = { heading, verses: [{ ...verse, cleanText }] };
    } else {
      // Capture a heading that fires on verse 1 of a chapter
      if (current.verses.length === 0 && heading) current.heading = heading;
      current.verses.push({ ...verse, cleanText });
    }
  }

  if (current.verses.length > 0) groups.push(current);
  return groups;
}

export default function VerseList({
  verses,
  book,
  chapter,
  highlights,
  bookmarks,
  notes,
  selectedVerse,
  rangeEnd,
  readingVerse,
  onVerseClick,
}: VerseListProps) {
  const bookInfo = getBook(book);
  const bookName = bookInfo?.name ?? "Bible";
  const groups = buildVerseGroups(verses, book, chapter);

  const rangeLow = selectedVerse !== null && rangeEnd != null ? Math.min(selectedVerse, rangeEnd) : null;
  const rangeHigh = selectedVerse !== null && rangeEnd != null ? Math.max(selectedVerse, rangeEnd) : null;

  return (
    <article>
      {/* Chapter heading */}
      <header className="mb-6 select-none">
        <div className="flex items-baseline gap-2.5">
          <h1 className="font-serif text-xl font-medium text-muted-foreground/50 tracking-tight">
            {bookName}
          </h1>
          <span className="font-serif text-5xl sm:text-6xl font-bold text-muted-foreground/15 leading-none">
            {chapter}
          </span>
        </div>
      </header>

      {/* Verses grouped into paragraphs with optional section headings */}
      <div className="bible-text">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.heading && (
              <span className="bible-section-heading">{group.heading}</span>
            )}
            <p>
              {group.verses.map((verse) => (
                <VerseItem
                  key={verse.pk}
                  verse={verse.verse}
                  text={verse.cleanText}
                  highlight={highlights.get(verse.verse)}
                  isBookmarked={bookmarks.has(verse.verse)}
                  hasNote={notes.has(verse.verse)}
                  isSelected={
                    rangeLow !== null && rangeHigh !== null
                      ? verse.verse >= rangeLow && verse.verse <= rangeHigh
                      : selectedVerse === verse.verse
                  }
                  isReading={readingVerse === verse.verse}
                  onClick={() => onVerseClick(verse.verse)}
                />
              ))}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}
