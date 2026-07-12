import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="bg-card border rounded-xl p-8 shadow-sm">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 -ml-0.5 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>

      <Mail className="h-10 w-10 text-primary mb-4" />
      <h1 className="font-serif text-2xl font-bold mb-2">Forgot your password?</h1>
      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
        Automatic password reset isn&apos;t set up yet. Email{" "}
        <a
          href="mailto:support@parakletos.app"
          className="text-primary font-medium hover:underline"
        >
          support@parakletos.app
        </a>{" "}
        from the address on your account and we&apos;ll help you regain access. If you signed up
        with Google, you can sign in with Google instead — no password needed.
      </p>

      <Link
        href="/login"
        className="text-sm text-primary font-medium hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  );
}
