"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APP_ERROR]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
        <h1 className="font-serif text-3xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground text-sm mb-6">
          An unexpected error occurred. You can try again, or head back home.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Parakletos
          </Link>
        </div>
      </div>
    </div>
  );
}
