"use client";

import { useState } from "react";
import {
  Highlighter,
  Bookmark,
  BookmarkCheck,
  NotebookPen,
  BookOpenText,
  Copy,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { HIGHLIGHT_COLORS, type HighlightColor } from "@/types/index";
import { formatReference } from "@/lib/bible-books";
import { cn } from "@/lib/utils";

interface VerseActionsBarProps {
  verse: number;
  text: string;
  translation: string;
  book: number;
  chapter: number;
  currentHighlight: string | null;
  isBookmarked: boolean;
  hasNote: boolean;
  note?: { id: string; content: string };
  onHighlight: (color: HighlightColor | null) => Promise<void>;
  onBookmark: () => Promise<void>;
  onNote: (content: string) => Promise<void>;
  onStudy: () => void;
  onClose: () => void;
}

export default function VerseActionsBar({
  verse,
  text,
  book,
  chapter,
  currentHighlight,
  isBookmarked,
  hasNote,
  note,
  onHighlight,
  onBookmark,
  onNote,
  onStudy,
  onClose,
}: VerseActionsBarProps) {
  const [showColors, setShowColors] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteContent, setNoteContent] = useState(note?.content ?? "");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleColorSelect(color: HighlightColor) {
    if (color === currentHighlight) {
      await onHighlight(null);
      toast.success("Highlight removed");
    } else {
      await onHighlight(color);
      toast.success("Verse highlighted");
    }
    setShowColors(false);
  }

  async function handleCopy() {
    const ref = formatReference(book, chapter, verse);
    await navigator.clipboard.writeText(`"${text}" — ${ref}`);
    setCopied(true);
    toast.success("Verse copied");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveNote() {
    if (!noteContent.trim()) return;
    setIsSavingNote(true);
    try {
      await onNote(noteContent.trim());
      toast.success("Note saved");
      setShowNoteEditor(false);
    } finally {
      setIsSavingNote(false);
    }
  }

  const ref = formatReference(book, chapter, verse);

  return (
    <>
      {/* Note Editor Overlay */}
      {showNoteEditor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card border rounded-xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <p className="font-medium text-sm">Note on {ref}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{text}</p>
              </div>
              <button
                onClick={() => setShowNoteEditor(false)}
                className="p-1 rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your thoughts..."
                className="w-full h-32 bg-muted/50 border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
            </div>
            <div className="flex gap-2 p-4 pt-0">
              <button
                onClick={() => setShowNoteEditor(false)}
                className="flex-1 py-2 px-4 border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote || !noteContent.trim()}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isSavingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-3 pointer-events-none">
        <div className="bg-card border rounded-2xl shadow-xl pointer-events-auto w-full max-w-lg animate-fade-in">
          {/* Verse reference */}
          <div className="px-4 pt-3 pb-2 border-b">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-primary">{ref}</p>
              <button onClick={onClose} className="p-1 rounded-md hover:bg-muted">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 font-serif">{text}</p>
          </div>

          {/* Color picker (shown when highlight active) */}
          {showColors && (
            <div className="px-4 py-2 border-b flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Highlight:</span>
              {HIGHLIGHT_COLORS.map(({ color, bg }) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-transform hover:scale-110 border-2",
                    bg,
                    currentHighlight === color ? "border-foreground scale-110" : "border-transparent"
                  )}
                />
              ))}
              {currentHighlight && (
                <button
                  onClick={() => { onHighlight(null); setShowColors(false); }}
                  className="ml-1 text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-around p-2">
            <ActionButton
              icon={<Highlighter className="h-5 w-5" />}
              label="Highlight"
              active={!!currentHighlight}
              onClick={() => setShowColors(!showColors)}
            />
            <ActionButton
              icon={
                isBookmarked ? (
                  <BookmarkCheck className="h-5 w-5" />
                ) : (
                  <Bookmark className="h-5 w-5" />
                )
              }
              label={isBookmarked ? "Saved" : "Bookmark"}
              active={isBookmarked}
              onClick={onBookmark}
            />
            <ActionButton
              icon={<NotebookPen className="h-5 w-5" />}
              label={hasNote ? "Edit Note" : "Add Note"}
              active={hasNote}
              onClick={() => {
                setNoteContent(note?.content ?? "");
                setShowNoteEditor(true);
              }}
            />
            <ActionButton
              icon={<BookOpenText className="h-5 w-5" />}
              label="Study"
              onClick={onStudy}
            />
            <ActionButton
              icon={copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              label="Copy"
              onClick={handleCopy}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[56px]",
        active
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
