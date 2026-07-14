"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, ChevronLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectScriptureRefs } from "@/lib/detect-scriptures";
import { useAutosave } from "@/hooks/useAutosave";
import AudioRecorder from "./AudioRecorder";
import ScriptureCard from "./ScriptureCard";

interface SermonNote {
  id: string;
  title: string;
  date: string;
  speaker: string;
  location: string;
  notes: string;
}

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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const detectedRefs = useMemo(() => detectScriptureRefs(notes), [notes]);

  const { status: saveStatus, schedule } = useAutosave<Omit<SermonNote, "id">>({
    save: async (payload) => {
      const res = await fetch(`/api/sermon-notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    },
  });

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
    schedule(formRef.current);
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

          {/* Audio recorder — download-only; recordings are not stored with the note */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Record &amp; download (audio isn&apos;t saved with the note)
            </Label>
            <AudioRecorder />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes</Label>

            {/* Mobile: scripture cards appear above the textarea */}
            {detectedRefs.length > 0 && (
              <div className="lg:hidden space-y-2 pb-1">
                {detectedRefs.map((ref) => (
                  <ScriptureCard key={ref.key} scripture={ref} />
                ))}
              </div>
            )}

            <Textarea
              value={notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder={
                "Type your sermon notes here…\n\nScripture references like John 3:16 or Romans 8 will be automatically detected."
              }
              className="min-h-[200px] sm:min-h-[420px] resize-y font-sans text-sm leading-relaxed"
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
                &ldquo;Romans 8&rdquo; will appear here with the verse text.
              </p>
            ) : (
              <div className="space-y-2">
                {detectedRefs.map((ref) => (
                  <ScriptureCard key={ref.key} scripture={ref} />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
