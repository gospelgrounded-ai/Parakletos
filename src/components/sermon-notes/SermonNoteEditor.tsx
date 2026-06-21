"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectScriptureRefs } from "@/lib/detect-scriptures";
import AudioRecorder from "./AudioRecorder";

interface SermonNote {
  id: string;
  title: string;
  date: string;
  speaker: string;
  location: string;
  notes: string;
}

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface Props {
  note: SermonNote;
}

export default function SermonNoteEditor({ note }: Props) {
  const router = useRouter();

  // Single source of truth for form — using ref to avoid stale closure issues
  const formRef = useRef({
    title: note.title,
    date: note.date,
    speaker: note.speaker,
    location: note.location,
    notes: note.notes,
  });

  const [title, setTitle] = useState(note.title);
  const [date, setDate] = useState(note.date);
  const [speaker, setSpeaker] = useState(note.speaker);
  const [location, setLocation] = useState(note.location);
  const [notes, setNotes] = useState(note.notes);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detectedRefs = useMemo(() => detectScriptureRefs(notes), [notes]);

  const doSave = useCallback(
    async (payload: Omit<SermonNote, "id">) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/sermon-notes/${note.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setSaveStatus(res.ok ? "saved" : "error");
      } catch {
        setSaveStatus("error");
      }
    },
    [note.id]
  );

  const scheduleAutoSave = useCallback(
    (payload: Omit<SermonNote, "id">) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setSaveStatus("pending");
      timerRef.current = setTimeout(() => doSave(payload), 1500);
    },
    [doSave]
  );

  type FieldKey = keyof Omit<SermonNote, "id">;

  function handleChange(key: FieldKey, value: string) {
    formRef.current = { ...formRef.current, [key]: value };
    switch (key) {
      case "title":    setTitle(value);    break;
      case "date":     setDate(value);     break;
      case "speaker":  setSpeaker(value);  break;
      case "location": setLocation(value); break;
      case "notes":    setNotes(value);    break;
    }
    scheduleAutoSave(formRef.current);
  }

  async function deleteNote() {
    await fetch(`/api/sermon-notes/${note.id}`, { method: "DELETE" });
    router.push("/sermon-notes");
  }

  const saveLabel =
    saveStatus === "pending" || saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved"
      ? "Saved"
      : saveStatus === "error"
      ? "Save failed"
      : "";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/sermon-notes")}
          className="gap-1.5 -ml-2 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Sermon Notes</span>
        </Button>

        <div className="flex items-center gap-3">
          {saveLabel && (
            <span
              className={cn(
                "text-xs",
                saveStatus === "error" ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {saveLabel}
            </span>
          )}

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-destructive whitespace-nowrap">Delete this note?</span>
              <Button size="sm" variant="destructive" onClick={deleteNote}>
                Yes, delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Body: form + scripture sidebar */}
      <div className="flex gap-8">
        {/* Left: form */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Sermon title"
            className="text-xl font-semibold h-12 border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none bg-transparent"
          />

          {/* Metadata row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Speaker</Label>
              <Input
                value={speaker}
                onChange={(e) => handleChange("speaker", e.target.value)}
                placeholder="Speaker name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input
                value={location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Church / location"
              />
            </div>
          </div>

          {/* Audio recorder */}
          <AudioRecorder />

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes</Label>

            {/* Mobile: scripture chips appear above the textarea so they're always visible */}
            {detectedRefs.length > 0 && (
              <div className="lg:hidden flex flex-wrap gap-1.5 pb-1">
                {detectedRefs.map((ref) => (
                  <Link
                    key={ref.key}
                    href={`/bible/KJV/${ref.book}/${ref.chapter}${ref.verse ? `#v${ref.verse}` : ""}`}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    <BookOpen className="h-3 w-3" />
                    {ref.display}
                  </Link>
                ))}
              </div>
            )}

            <Textarea
              value={notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder={
                "Type your sermon notes here…\n\nScripture references like John 3:16 or Romans 8 will be automatically detected."
              }
              className="min-h-[200px] sm:min-h-[420px] resize-y font-mono text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Right: scripture sidebar (desktop only) */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-20 space-y-3 pt-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4 text-primary" />
              Scripture References
            </div>

            {detectedRefs.length === 0 ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                As you type, scripture references like &ldquo;John 3:16&rdquo; or
                &ldquo;Romans 8&rdquo; will appear here as links.
              </p>
            ) : (
              <ul className="space-y-1">
                {detectedRefs.map((ref) => (
                  <li key={ref.key}>
                    <Link
                      href={`/bible/KJV/${ref.book}/${ref.chapter}${ref.verse ? `#v${ref.verse}` : ""}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors group"
                    >
                      <span className="font-medium">{ref.display}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
