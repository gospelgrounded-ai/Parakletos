import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Terms of Service — Parakletos" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg font-bold">Parakletos</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors font-medium">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 pb-24">
        <h1 className="font-serif text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Parakletos (&ldquo;the Service&rdquo;), you agree to be bound by
              these Terms of Service. If you do not agree to these terms, please do not use the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Parakletos is a personal Bible study application that provides access to public-domain
              Bible translations, tools for highlighting and annotating scripture, reading plans, and
              sermon note-taking features. The Service is currently offered free of charge for
              personal, non-commercial use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activity that occurs under your account. You agree to provide accurate
              information when creating your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. User Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain ownership of any notes, highlights, and bookmarks you create within the
              Service. By using the Service, you grant us a limited licence to store and display your
              content solely for the purpose of providing the Service to you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Bible Translations</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Bible translations available through the Service are sourced from Bolls.life and
              are either in the public domain or provided under open licences. We do not claim
              ownership of any translation text. Translations are used for personal study purposes
              only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Prohibited Uses</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to use the Service to: (a) violate any applicable laws or regulations;
              (b) transmit any harmful, offensive, or unlawful content; (c) attempt to gain
              unauthorised access to any part of the Service; or (d) use the Service for commercial
              purposes without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not
              guarantee that the Service will be uninterrupted, error-free, or that any defects will
              be corrected.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to update these terms at any time. Continued use of the Service
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these terms, please contact us through the app.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">← Back to Parakletos</Link>
        <span className="mx-3">·</span>
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
      </footer>
    </div>
  );
}
