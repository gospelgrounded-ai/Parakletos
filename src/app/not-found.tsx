import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm">
        <BookOpen className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="font-serif text-3xl font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Back to Parakletos
        </Link>
      </div>
    </div>
  );
}
