import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { fetchChapter } from "@/lib/bible-api";
import { stripParagraphMark } from "@/lib/bible-structure";
import { getVoiceCatalog } from "@/lib/tts";

const MAX_TEXT_LENGTH = 4096;
const AUDIO_CACHE_CAP = 1200;
const PER_USER_DAILY_CHAR_LIMIT = 20_000;
const GLOBAL_DAILY_CHAR_LIMIT = 100_000;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { translation?: string; book?: number; chapter?: number; verse?: number; voice?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const translation = typeof body.translation === "string" ? body.translation.toUpperCase() : "";
  const book = Number(body.book);
  const chapter = Number(body.chapter);
  const verse = Number(body.verse);
  const requestedVoice = typeof body.voice === "string" ? body.voice : "";

  if (!translation || translation.length > 10) {
    return NextResponse.json({ error: "Invalid translation" }, { status: 400 });
  }
  if (!Number.isInteger(book) || book < 1 || book > 66) {
    return NextResponse.json({ error: "Invalid book" }, { status: 400 });
  }
  if (!Number.isInteger(chapter) || chapter < 1) {
    return NextResponse.json({ error: "Invalid chapter" }, { status: 400 });
  }
  if (!Number.isInteger(verse) || verse < 1) {
    return NextResponse.json({ error: "Invalid verse" }, { status: 400 });
  }

  const catalog = await getVoiceCatalog();
  if (!catalog.service) {
    return new Response("TTS not configured", { status: 503 });
  }
  const allowedVoiceIds = new Set(catalog.voices.map((v) => v.id));
  const safeVoice = allowedVoiceIds.has(requestedVoice) ? requestedVoice : catalog.defaultVoice;
  if (!safeVoice) {
    return new Response("TTS not configured", { status: 503 });
  }

  // ── Cache lookup — free replay, no quota consumed ─────────────────────────
  const cached = await db.audioCache
    .findUnique({
      where: {
        translation_book_chapter_verse_voice_service: {
          translation,
          book,
          chapter,
          verse,
          voice: safeVoice,
          service: catalog.service,
        },
      },
    })
    .catch(() => null);
  if (cached) {
    return new Response(cached.audio, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
    });
  }

  // ── Resolve verse text server-side — the client never supplies billable text ──
  let verses;
  try {
    verses = await fetchChapter(translation, book, chapter);
  } catch {
    return NextResponse.json({ error: "Failed to fetch verse text" }, { status: 502 });
  }
  const target = verses.find((v) => v.verse === verse);
  if (!target) {
    return NextResponse.json({ error: "Verse not found" }, { status: 404 });
  }
  const text = stripParagraphMark(target.text).slice(0, MAX_TEXT_LENGTH);
  if (!text) {
    return NextResponse.json({ error: "Verse has no text" }, { status: 404 });
  }

  // ── Quota — increment first, atomically, then check. Never check-then-increment. ──
  const date = todayUtc();
  const usage = await db.ttsUsage.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    create: { userId: session.user.id, date, charCount: text.length },
    update: { charCount: { increment: text.length } },
  });
  if (usage.charCount > PER_USER_DAILY_CHAR_LIMIT) {
    return new Response("Daily audio limit reached", { status: 429 });
  }
  const globalUsage = await db.ttsUsage.aggregate({
    where: { date },
    _sum: { charCount: true },
  });
  if ((globalUsage._sum.charCount ?? 0) > GLOBAL_DAILY_CHAR_LIMIT) {
    console.error("[TTS_BUDGET_EXCEEDED]", { date, total: globalUsage._sum.charCount });
    return new Response("Daily audio limit reached", { status: 429 });
  }

  // ── Generate — prefer the catalog's service, fall back to OpenAI on failure ──
  let audio = await generateAudio(catalog.service, safeVoice, text);
  let usedService: "elevenlabs" | "openai" = catalog.service;
  let usedVoice = safeVoice;
  if (!audio && catalog.service === "elevenlabs" && process.env.OPENAI_API_KEY) {
    audio = await generateAudio("openai", "onyx", text);
    usedService = "openai";
    usedVoice = "onyx";
  }
  if (!audio) {
    return new Response("TTS generation failed", { status: 502 });
  }

  const audioBuffer = Buffer.from(audio);
  await db.audioCache
    .create({
      data: {
        translation,
        book,
        chapter,
        verse,
        voice: usedVoice,
        service: usedService,
        audio: audioBuffer,
      },
    })
    .catch(() => {});
  maybeEvictAudioCache().catch(() => {});

  return new Response(audioBuffer, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
  });
}

async function generateAudio(
  service: "elevenlabs" | "openai",
  voice: string,
  text: string
): Promise<ArrayBuffer | null> {
  if (service === "elevenlabs") {
    const elKey = process.env.ELEVENLABS_API_KEY;
    if (!elKey) return null;
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: "POST",
      headers: {
        "xi-api-key": elKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.85,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    });
    if (elRes.ok) return elRes.arrayBuffer();
    console.error("ElevenLabs TTS error:", elRes.status, await elRes.text());
    return null;
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null;
  const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "tts-1", voice, input: text }),
  });
  if (!ttsResponse.ok) {
    console.error("OpenAI TTS error:", ttsResponse.status, await ttsResponse.text());
    return null;
  }
  return ttsResponse.arrayBuffer();
}

async function maybeEvictAudioCache() {
  if (Math.random() > 0.1) return;
  const count = await db.audioCache.count();
  if (count <= AUDIO_CACHE_CAP) return;
  const excess = count - AUDIO_CACHE_CAP;
  const oldest = await db.audioCache.findMany({
    orderBy: { createdAt: "asc" },
    take: excess,
    select: { id: true },
  });
  if (oldest.length > 0) {
    await db.audioCache.deleteMany({ where: { id: { in: oldest.map((o) => o.id) } } });
  }
}
