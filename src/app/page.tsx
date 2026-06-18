import Link from "next/link";
import { BookOpen, Bookmark, Highlighter, NotebookPen, Search, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            <span className="font-serif text-xl font-bold text-foreground">Parakletos</span>
          </div>
          <div className="flex items-center gap-3">
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

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
          <BookOpen className="h-4 w-4" />
          Παράκλητος — The Helper
        </div>
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
          Scripture, the way<br />
          <span className="text-primary">it was meant</span> to be read.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          The depth of a study Bible with the simplicity of a reading app. Multiple
          translations, highlights, notes, cross-references, and reading plans — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="bg-primary text-primary-foreground px-8 py-3.5 rounded-lg font-medium text-base hover:bg-primary/90 transition-colors"
          >
            Start reading for free
          </Link>
          <Link
            href="/bible/KJV/43/1"
            className="border border-border px-8 py-3.5 rounded-lg font-medium text-base hover:bg-muted transition-colors"
          >
            Preview John 1
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <BookOpen className="h-6 w-6" />,
              title: "Multiple Translations",
              desc: "Read side-by-side in KJV, NKJV, WEB, ASV, and dozens more. Switch instantly.",
            },
            {
              icon: <Highlighter className="h-6 w-6" />,
              title: "Color Highlights",
              desc: "Mark verses in 5 colors. Your highlights sync across all your devices.",
            },
            {
              icon: <NotebookPen className="h-6 w-6" />,
              title: "Personal Notes",
              desc: "Write study notes on any verse. Keep a digital margin journal.",
            },
            {
              icon: <Bookmark className="h-6 w-6" />,
              title: "Bookmarks",
              desc: "Save verses to return to. Organize by topic or let us remember for you.",
            },
            {
              icon: <Search className="h-6 w-6" />,
              title: "Powerful Search",
              desc: "Find any word or phrase across the entire Bible instantly.",
            },
            {
              icon: <Users className="h-6 w-6" />,
              title: "Reading Plans",
              desc: "Follow structured plans like Bible in a Year or Gospels in 40 Days.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="text-primary mb-3">{f.icon}</div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-serif font-semibold text-foreground">Parakletos</span>
        </div>
        <p>Built for those who love the Word.</p>
      </footer>
    </div>
  );
}
