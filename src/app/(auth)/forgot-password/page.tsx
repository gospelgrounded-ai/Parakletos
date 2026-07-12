"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<"idle" | "sent" | "unconfigured">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResult(data.configured === false ? "unconfigured" : "sent");
    } catch {
      setResult("unconfigured");
    } finally {
      setIsLoading(false);
    }
  }

  if (result === "sent") {
    return (
      <div className="bg-card border rounded-xl p-8 shadow-sm text-center">
        <CheckCircle className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold mb-2">Check your inbox</h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          If <strong>{email}</strong> is registered with a password, you&apos;ll receive a reset
          link shortly. If you signed up with Google, sign in with Google instead — no password
          needed.
        </p>
        <Link href="/login" className="text-sm text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (result === "unconfigured") {
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
          <a href="mailto:support@parakletos.app" className="text-primary font-medium hover:underline">
            support@parakletos.app
          </a>{" "}
          from the address on your account and we&apos;ll help you regain access. If you signed
          up with Google, you can sign in with Google instead — no password needed.
        </p>
        <Link href="/login" className="text-sm text-primary font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-xl p-8 shadow-sm">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 -ml-0.5 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>

      <h1 className="font-serif text-2xl font-bold mb-1">Forgot your password?</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || !email}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>
    </div>
  );
}
