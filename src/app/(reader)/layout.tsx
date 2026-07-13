import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default async function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session) {
    return <AppShell>{children}</AppShell>;
  }

  // Guest reading layout — no sidebar, minimal header with sign-in prompt
  return (
    <div className="guest-shell min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-serif font-bold">Parakletos</span>
          </Link>
          <p className="text-sm text-muted-foreground hidden sm:block flex-1">
            Sign in to highlight verses, take notes, and sync across devices
          </p>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
