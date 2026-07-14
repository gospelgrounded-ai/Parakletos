"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Highlighter, Calendar, X, Sparkles } from "lucide-react";

const DISMISS_KEY = "parakletos-getting-started-dismissed";

const STEPS = [
  {
    href: "/bible/KJV/43/1",
    icon: BookOpen,
    title: "Read a chapter",
    hint: "Start with John 1 — the reader remembers where you left off",
  },
  {
    href: "/bible/KJV/43/1",
    icon: Highlighter,
    title: "Highlight a verse",
    hint: "Tap any verse while reading to highlight, note, or memorize it",
  },
  {
    href: "/plans",
    icon: Calendar,
    title: "Start a reading plan",
    hint: "Structured plans like the Gospels in 40 Days keep you on track",
  },
] as const;

/**
 * One-time checklist for brand-new accounts. Renders `fallback` (the normal
 * Today card) once dismissed; dismissal persists in localStorage.
 */
export default function GettingStartedCard({ fallback }: { fallback: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return <>{fallback}</>;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage unavailable — dismiss for this session only
    }
    setDismissed(true);
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        Getting started
      </h2>
      <div className="rounded-xl border-2 border-primary/20 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <p className="text-sm text-muted-foreground">
            Welcome to Parakletos! Three ways to begin:
          </p>
          <button
            onClick={dismiss}
            aria-label="Dismiss getting started"
            className="p-2 -m-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="divide-y">
          {STEPS.map(({ href, icon: Icon, title, hint }) => (
            <Link
              key={title}
              href={href}
              className="flex items-center gap-4 p-4 min-h-[56px] hover:bg-muted/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
