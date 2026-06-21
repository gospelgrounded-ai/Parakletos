"use client";

import type { Metadata } from "next";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    // Stub — always responds with success to avoid email enumeration.
    // Wire up a real email provider (Resend, SendGrid, etc.) here when ready.
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-card border rounded-xl p-8 shadow-sm text-center">
        <CheckCircle className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold mb-2">Check your inbox</h1>
        <p className="text-muted-foreground text-sm mb-6">
          If <strong>{email}</strong> is registered, you&apos;ll receive a
          password reset link shortly.
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
