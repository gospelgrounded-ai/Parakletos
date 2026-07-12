import { Bookmark, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { HighlightColor, getHighlightClass } from "@/types";

interface VerseItemProps {
  verse: number;
  text: string;
  highlight?: { id: string; color: string };
  isBookmarked?: boolean;
  hasNote?: boolean;
  isSelected?: boolean;
  isReading?: boolean;
  onClick: () => void;
}

export default function VerseItem({
  verse,
  text,
  highlight,
  isBookmarked,
  hasNote,
  isSelected,
  isReading,
  onClick,
}: VerseItemProps) {
  const highlightClass = highlight
    ? getHighlightClass(highlight.color as HighlightColor)
    : null;

  return (
    <span
      id={`v${verse}`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Verse ${verse}`}
      className={cn(
        "group relative inline cursor-pointer rounded-sm transition-colors duration-150",
        "hover:bg-primary/5",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60",
        isReading && "bg-amber-400/15 outline outline-1 outline-amber-400/40 rounded",
        isSelected && "bg-primary/10 outline outline-1 outline-primary/20 rounded",
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Verse number */}
      <sup className="bible-verse-num select-none mr-0.5">{verse}</sup>

      {/* Verse text — with optional highlight */}
      {highlightClass ? (
        <mark
          className={cn(
            "bg-transparent rounded-sm transition-colors duration-150",
            highlightClass
          )}
        >
          {text}
        </mark>
      ) : (
        <span>{text}</span>
      )}

      {/* Inline indicators */}
      {(isBookmarked || hasNote) && (
        <span className="inline-flex items-center gap-0.5 ml-0.5 align-middle">
          {isBookmarked && (
            <Bookmark
              className="inline-block h-2.5 w-2.5 fill-primary/60 text-primary/60"
              aria-label="Bookmarked"
            />
          )}
          {hasNote && (
            <PenLine
              className="inline-block h-2.5 w-2.5 text-amber-500/80"
              aria-label="Has note"
            />
          )}
        </span>
      )}

      {/* Space between verses */}
      {" "}
    </span>
  );
}
