import { getBook } from "@/lib/bible-books";
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
  readingVerse?: number | null;
  onVerseClick: (verse: number) => void;
}

export default function VerseList({
  verses,
  book,
  chapter,
  highlights,
  bookmarks,
  notes,
  selectedVerse,
  readingVerse,
  onVerseClick,
}: VerseListProps) {
  const bookInfo = getBook(book);
  const bookName = bookInfo?.name ?? "Bible";

  return (
    <article>
      {/* Chapter heading */}
      <header className="mb-8 select-none">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-muted-foreground/60 tracking-tight">
          {bookName}
        </h1>
        <p className="font-serif text-6xl sm:text-7xl font-bold text-muted-foreground/20 leading-none mt-1">
          {chapter}
        </p>
      </header>

      {/* Verses — rendered as a single flowing text block */}
      <div className="bible-text text-lg sm:text-xl leading-[1.9]">
        {verses.map((verse) => (
          <VerseItem
            key={verse.pk}
            verse={verse.verse}
            text={verse.text}
            highlight={highlights.get(verse.verse)}
            isBookmarked={bookmarks.has(verse.verse)}
            hasNote={notes.has(verse.verse)}
            isSelected={selectedVerse === verse.verse}
            isReading={readingVerse === verse.verse}
            onClick={() => onVerseClick(verse.verse)}
          />
        ))}
      </div>
    </article>
  );
}
