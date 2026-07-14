"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, ChevronLeft, Link2, Link2Off, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { detectScriptureRefs } from "@/lib/detect-scriptures";
import { formatStamp, parseStamps } from "@/lib/timestamps";
import { useAutosave } from "@/hooks/useAutosave";
import { useReaderSettings } from "@/hooks/useReaderSettings";
import { useTranslations } from "@/hooks/useTranslations";
import AudioRecorder from "./AudioRecorder";
import ScriptureCard from "./ScriptureCard";

interface SermonNote {
  id: string;
  title: string;
  date: string;
  speaker: string;
  location: string;
  notes: string;
  series: string;
  tags: string;
  isFavorite: boolean;
  shareToken: string | null;
  translation: string | null;
}

interface SavePayload {
  title: string;
  date: string;
  speaker: string;
  location: string;
  notes: string;
  series: string;
  tags: string;
  translation: string | null;
}

interface Props {
  note: SermonNote;
}

const listFetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : []));

function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function SermonNoteEditor({ note }: Props) {
  const router = useRouter();
  const { settings } = useReaderSettings();
  const { popular } = useTranslations();

  // Single source of truth for form — using ref to avoid stale closure issues
  const formRef = useRef<SavePayload>({
    title: note.title,
    date: note.date,
    speaker: note.speaker,
    location: note.location,
    notes: note.notes,
    series: note.series,
    tags: note.tags,
    translation: note.translation,
  });

  const [title, setTitle] = useState(note.title);
  const [date, setDate] = useState(note.date);
  const [speaker, setSpeaker] = useState(note.speaker);
  const [location, setLocation] = useState(note.location);
  const [notes, setNotes] = useState(note.notes);
  const [series, setSeries] = useState(note.series);
  const [tags, setTags] = useState<string[]>(parseTags(note.tags));
  const [tagInput, setTagInput] = useState("");
  const [isFavorite, setIsFavorite] = useState(note.isFavorite);
  const [translationPref, setTranslationPref] = useState<string | null>(note.translation);
  const [shareToken, setShareToken] = useState(note.shareToken);
  const [sharing, setSharing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const detectedRefs = useMemo(() => detectScriptureRefs(notes), [notes]);
  const stamps = useMemo(() => parseStamps(notes), [notes]);
  const cardTranslation = translationPref ?? settings.defaultTranslation;

  // Existing series names for the datalist (deduped, excluding blanks)
  const { data: allNotes } = useSWR<Array<{ series?: string }>>(
    "/api/sermon-notes",
    listFetcher,
    { revalidateOnFocus: false }
  );
  const seriesOptions = useMemo(() => {
    const set = new Set<string>();
    for (const n of allNotes ?? []) {
      if (n.series) set.add(n.series);
    }
    return [...set].sort();
  }, [allNotes]);

  const { status: saveStatus, schedule } = useAutosave<SavePayload>({
    save: async (payload) => {
      const res = await fetch(`/api/sermon-notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    },
  });

  function updateField<K extends keyof SavePayload>(key: K, value: SavePayload[K]) {
    formRef.current = { ...formRef.current, [key]: value };
    schedule(formRef.current);
  }

  function handleChange(
    key: "title" | "date" | "speaker" | "location" | "notes" | "series",
    value: string
  ) {
    switch (key) {
      case "title":    setTitle(value);    break;
      case "date":     setDate(value);     break;
      case "speaker":  setSpeaker(value);  break;
      case "location": setLocation(value); break;
      case "notes":    setNotes(value);    break;
      case "series":   setSeries(value);   break;
    }
    updateField(key, value);
  }

  /** Insert text at the caret in the notes textarea, keeping autosave in sync. */
  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    const current = formRef.current.notes;
    const pos = el ? el.selectionStart : current.length;
    const next = current.slice(0, pos) + text + current.slice(pos);
    handleChange("notes", next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const caret = pos + text.length;
      el.setSelectionRange(caret, caret);
    });
  }

  function commitTag(raw: string) {
    const value = raw.trim().replace(/,+$/, "");
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setTagInput("");
      return;
    }
    const next = [...tags, value];
    setTags(next);
    setTagInput("");
    updateField("tags", next.join(","));
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    updateField("tags", next.join(","));
  }

  async function toggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const res = await fetch(`/api/sermon-notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setIsFavorite(!next);
    }
  }

  function handleTranslationChange(value: string) {
    const next = value === "" ? null : value;
    setTranslationPref(next);
    updateField("translation", next);
  }

  async function copyShareLink(token: string) {
    const url = `${window.location.origin}/shared/sermon/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied — anyone with it can read this note");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  async function enableShare() {
    setSharing(true);
    try {
      const res = await fetch(`/api/sermon-notes/${note.id}/share`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      setShareToken(token);
      await copyShareLink(token);
    } catch {
      toast.error("Couldn't create a share link");
    } finally {
      setSharing(false);
    }
  }

  async function stopSharing() {
    try {
      const res = await fetch(`/api/sermon-notes/${note.id}/share`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setShareToken(null);
      toast.success("Sharing stopped — the old link no longer works");
    } catch {
      toast.error("Couldn't stop sharing");
    }
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

        <div className="flex items-center gap-2">
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

          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "h-9 w-9",
              isFavorite
                ? "text-amber-500 hover:text-amber-600"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={toggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </Button>

          {shareToken ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-primary"
                onClick={() => copyShareLink(shareToken)}
                aria-label="Copy share link"
                title="Copy share link"
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={stopSharing}
                aria-label="Stop sharing"
                title="Stop sharing"
              >
                <Link2Off className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={enableShare}
              disabled={sharing}
              aria-label="Share via link"
              title="Share via link"
            >
              <Link2 className="h-4 w-4" />
            </Button>
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
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
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

          {/* Metadata rows */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sermon-series" className="text-xs text-muted-foreground">
                Series
              </Label>
              <Input
                id="sermon-series"
                list="series-options"
                value={series}
                onChange={(e) => handleChange("series", e.target.value)}
                placeholder="e.g. Romans: Living by Faith"
                maxLength={200}
              />
              <datalist id="series-options">
                {seriesOptions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scripture-translation" className="text-xs text-muted-foreground">
                Scripture translation
              </Label>
              <select
                id="scripture-translation"
                value={translationPref ?? ""}
                onChange={(e) => handleTranslationChange(e.target.value)}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">App default ({settings.defaultTranslation})</option>
                {popular.map((t) => (
                  <option key={t.short_name} value={t.short_name}>
                    {t.short_name} — {t.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="sermon-tags" className="text-xs text-muted-foreground">
              Tags
            </Label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="hover:text-destructive -mr-0.5 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                id="sermon-tags"
                value={tagInput}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.endsWith(",")) commitTag(v);
                  else setTagInput(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitTag(tagInput);
                  } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                    removeTag(tags[tags.length - 1]);
                  }
                }}
                onBlur={() => commitTag(tagInput)}
                placeholder={tags.length === 0 ? "faith, grace, gospel…" : "Add tag"}
                className="flex-1 min-w-[100px] bg-transparent text-sm py-0.5 focus:outline-none placeholder:text-muted-foreground"
                maxLength={60}
              />
            </div>
          </div>

          {/* Audio recorder — persists on this device (IndexedDB), never uploaded */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Recording (kept on this device — not uploaded)
            </Label>
            <AudioRecorder
              noteId={note.id}
              stamps={stamps}
              onStamp={(seconds) => insertAtCursor(`${formatStamp(seconds)} `)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              {notes.trim() === "" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    handleChange(
                      "notes",
                      "## Big Idea\n\n\n## Key Points\n\n1. \n\n## Scriptures\n\n\n## Application\n\n\n## Prayer\n\n"
                    )
                  }
                >
                  Use outline
                </Button>
              )}
            </div>

            {/* Mobile: scripture cards appear above the textarea */}
            {detectedRefs.length > 0 && (
              <div className="lg:hidden space-y-2 pb-1">
                {detectedRefs.map((ref) => (
                  <ScriptureCard
                    key={ref.key}
                    scripture={ref}
                    translation={cardTranslation}
                    onInsert={insertAtCursor}
                  />
                ))}
              </div>
            )}

            <Textarea
              ref={textareaRef}
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
                  <ScriptureCard
                    key={ref.key}
                    scripture={ref}
                    translation={cardTranslation}
                    onInsert={insertAtCursor}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
