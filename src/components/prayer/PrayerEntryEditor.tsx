"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrayerEntry {
  id: string;
  title: string;
  content: string;
  isAnswered: boolean;
}

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface Props {
  entry: PrayerEntry;
}

export default function PrayerEntryEditor({ entry }: Props) {
  const router = useRouter();

  const formRef = useRef({ title: entry.title, content: entry.content });

  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [isAnswered, setIsAnswered] = useState(entry.isAnswered);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(
    async (payload: { title: string; content: string }) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/prayer/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setSaveStatus(res.ok ? "saved" : "error");
      } catch {
        setSaveStatus("error");
      }
    },
    [entry.id]
  );

  const scheduleAutoSave = useCallback(
    (payload: { title: string; content: string }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setSaveStatus("pending");
      timerRef.current = setTimeout(() => doSave(payload), 1500);
    },
    [doSave]
  );

  function handleChange(key: "title" | "content", value: string) {
    formRef.current = { ...formRef.current, [key]: value };
    if (key === "title") setTitle(value);
    else setContent(value);
    scheduleAutoSave(formRef.current);
  }

  async function toggleAnswered() {
    const next = !isAnswered;
    setIsAnswered(next);
    try {
      await fetch(`/api/prayer/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAnswered: next }),
      });
    } catch {
      setIsAnswered(!next);
    }
  }

  async function deleteEntry() {
    await fetch(`/api/prayer/${entry.id}`, { method: "DELETE" });
    router.push("/prayer");
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/prayer")}
          className="gap-1.5 -ml-2 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prayer Journal</span>
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
              <span className="text-xs text-destructive whitespace-nowrap">Delete this prayer?</span>
              <Button size="sm" variant="destructive" onClick={deleteEntry}>
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
              aria-label="Delete prayer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <Input
          value={title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="What are you praying for?"
          className="text-xl font-semibold h-12 border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none bg-transparent"
        />

        <button
          onClick={toggleAnswered}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            isAnswered
              ? "border-success/40 bg-success/10 text-success"
              : "hover:bg-muted text-muted-foreground"
          )}
        >
          {isAnswered ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
          {isAnswered ? "Answered" : "Mark as answered"}
        </button>

        <Textarea
          value={content}
          onChange={(e) => handleChange("content", e.target.value)}
          placeholder="Write your prayer, request, or what God is teaching you through it…"
          className="min-h-[240px] sm:min-h-[400px] resize-y text-sm leading-relaxed"
        />
      </div>
    </div>
  );
}
