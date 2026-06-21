import Link from "next/link";
import { BookOpen, Highlighter, NotebookPen, Bookmark, Search, Users } from "lucide-react";

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
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
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
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/register"
            className="bg-primary text-primary-foreground px-8 py-3.5 rounded-lg font-medium text-base hover:bg-primary/90 transition-colors"
          >
            Start reading for free
          </Link>
          <p className="text-xs text-muted-foreground">Free forever. No credit card required.</p>
          <Link
            href="/bible/KJV/43/1"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            or preview a chapter →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-24 space-y-6">
        {/* Featured differentiators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="text-primary mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Multiple Translations</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Read side-by-side in KJV, NKJV, WEB, ASV, and dozens more. Switch instantly, or
              open any two translations in parallel with a single tap.
            </p>
          </div>
          <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="text-primary mb-3">
              <NotebookPen className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Personal Notes</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Write study notes on any verse and keep a digital margin journal. Your notes
              stay attached to the verse, no matter which translation you read in.
            </p>
          </div>
        </div>

        {/* Highlights card - full width */}
        <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow flex items-start gap-4">
          <div className="text-primary shrink-0 mt-0.5">
            <Highlighter className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Color Highlights</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Mark verses in 5 colors. Your highlights sync across all your devices so your
              study stays with you everywhere.
            </p>
          </div>
        </div>

        {/* Compressed secondary features */}
        <div className="rounded-xl border bg-muted/30 px-6 py-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Also included:</span>{" "}
            <span className="inline-flex items-center gap-1">
              <Bookmark className="h-3.5 w-3.5 shrink-0" /> Bookmarks,
            </span>{" "}
            <span className="inline-flex items-center gap-1">
              <Search className="h-3.5 w-3.5 shrink-0" /> full-Bible search,
            </span>{" "}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 shrink-0" /> structured reading plans
            </span>{" "}
            (Bible in a Year, Gospels in 40 Days, and more).
          </p>
        </div>

        {/* Differentiation */}
        <p className="text-center text-sm text-muted-foreground pt-2">
          No ads. No clutter. No subscription —{" "}
          <span className="text-foreground font-medium">just the Word, and your notes.</span>
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <h2 className="font-serif text-2xl font-bold mb-6 text-center">Common questions</h2>
        <div className="divide-y rounded-xl border bg-card overflow-hidden">
          {[
            {
              q: "Is it really free?",
              a: "Yes, completely free. No credit card, no trial period, and no paid subscription. Every translation and every feature is included at no cost.",
            },
            {
              q: "Which Bible translations are included?",
              a: "Over 80 translations, including KJV, NKJV, WEB, ASV, NET, and many more in multiple languages. All powered by the Bolls.life API.",
            },
            {
              q: "Do my highlights and notes sync across devices?",
              a: "Yes. Your highlights, bookmarks, and notes are stored in your account and available on any device you sign in to.",
            },
            {
              q: "Does it work offline?",
              a: "Not yet — Parakletos currently requires an internet connection to load Bible text. Offline reading is on our roadmap.",
            },
            {
              q: "How is this different from YouVersion or Bible Gateway?",
              a: "We built Parakletos for serious study: no ads, no social feeds, no distractions — just a clean reading experience with powerful annotation tools, multiple translations side-by-side, and structured reading plans.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="px-6 py-5">
              <p className="font-medium text-sm mb-1.5">{q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
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
        <p className="mb-3">Built for those who love the Word.</p>
        <div className="flex items-center justify-center gap-4 text-xs">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <span>·</span>
          <a href="mailto:support@parakletos.app" className="hover:text-foreground transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}
