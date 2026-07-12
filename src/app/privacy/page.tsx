import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Privacy Policy — Parakletos" };

export default function PrivacyPage() {
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
        <h1 className="font-serif text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you create an account, we collect your name, email address, and a hashed version
              of your password. If you sign in with Google, we receive your name, email, and profile
              image from Google. We also store content you create: highlights, bookmarks, notes,
              sermon notes, and prayer journal entries.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your information solely to provide the Service — to authenticate you, to store
              and sync your Bible study data across your devices, and to personalise your reading
              experience. We do not sell your data to third parties or use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Data Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored in a secure PostgreSQL database hosted by Neon. Data is encrypted
              in transit (HTTPS) and at rest. We retain your data for as long as your account is
              active.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the following third-party services: <strong>Bolls.life</strong> for Bible text,{" "}
              <strong>bible.helloao.org</strong>, <strong>Open Scriptures</strong>, and{" "}
              <strong>openbible.info</strong> for study data (no personal data is sent to any of
              these); <strong>ElevenLabs</strong> or <strong>OpenAI</strong> for optional text-to-speech,
              which receive only the verse text being read aloud, never your account details;{" "}
              <strong>Google OAuth</strong> (optional, for sign-in); and <strong>Vercel</strong> and{" "}
              <strong>Neon</strong> for hosting and database storage. These services have their own
              privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              From your <Link href="/settings" className="underline hover:text-foreground">Settings</Link> page
              you can export a copy of your data (highlights, bookmarks, notes, sermon notes, prayer
              journal, reading plans, and preferences) as a JSON file, or permanently delete your account and all
              associated data. Account deletion is immediate and cannot be undone. If you need help
              with either, email{" "}
              <a href="mailto:support@parakletos.app" className="underline hover:text-foreground">support@parakletos.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use a single session cookie to keep you signed in. No tracking cookies or
              advertising cookies are used.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is not directed at children under 13. We do not knowingly collect personal
              information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. We will notify registered users of
              material changes by posting a notice within the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy questions or data requests, please email{" "}
              <a href="mailto:support@parakletos.app" className="underline hover:text-foreground">support@parakletos.app</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">← Back to Parakletos</Link>
        <span className="mx-3">·</span>
        <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
      </footer>
    </div>
  );
}
