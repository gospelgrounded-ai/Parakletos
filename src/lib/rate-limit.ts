import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;

/**
 * Sliding-window-ish counter backed by the RateLimit table. Returns true if
 * the action is allowed, false if `key` has exceeded `limit` calls within
 * the current window. Fails open (allows the request) if the DB is
 * unreachable — this is a supplementary defense, not the primary boundary.
 */
export async function checkRateLimit(key: string, limit: number): Promise<boolean> {
  const now = new Date();
  try {
    const existing = await db.rateLimit.findUnique({ where: { key } });

    if (!existing || now.getTime() - existing.windowStart.getTime() > WINDOW_MS) {
      await db.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now },
        update: { count: 1, windowStart: now },
      });
      return true;
    }

    if (existing.count >= limit) {
      return false;
    }

    await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return true;
  } catch {
    return true;
  }
}

/** Best-effort client IP from Vercel/proxy headers. */
export function clientIp(request: Request | undefined): string {
  const forwardedFor = request?.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request?.headers.get("x-real-ip") ?? "unknown";
}
