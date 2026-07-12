import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  let email: string | undefined;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    // Automated reset isn't wired up — tell the client honestly. This is a
    // static, app-wide fact (not per-email), so it doesn't leak whether the
    // address is registered.
    return NextResponse.json({ configured: false });
  }

  // Always respond identically from here on, regardless of whether the
  // email is registered, to avoid account enumeration.
  const allowed = await checkRateLimit(`forgot-password:${email.toLowerCase()}`, 3);
  if (allowed) {
    const user = await db.user.findUnique({ where: { email } });
    if (user?.password) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL ?? new URL(request.url).origin;
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Parakletos <noreply@parakletos.app>",
          to: email,
          subject: "Reset your Parakletos password",
          html: `<p>Someone requested a password reset for this account. Click below to choose a new password — this link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
        }),
      }).catch((err) => console.error("[FORGOT_PASSWORD] Resend send failed", err));
    }
    // user === null, or user signed up via Google (no password): no email
    // sent, but we still return success below to avoid enumeration.
  }

  return NextResponse.json({ configured: true });
}
