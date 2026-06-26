import { NextRequest } from "next/server";

const VALID_OPENAI_VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]);
const MAX_TEXT_LENGTH = 4096;

export async function POST(request: NextRequest) {
  let text: string, voice: string;
  try {
    ({ text, voice } = await request.json());
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  if (!text || typeof text !== "string") {
    return new Response("text is required", { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return new Response("text too long", { status: 400 });
  }

  const elKey = process.env.ELEVENLABS_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // ── ElevenLabs ──────────────────────────────────────────────────────────────
  if (elKey) {
    const voiceId = voice && voice.length > 10 ? voice : "pNInz6obpgDQGcFmaJgB"; // Adam fallback
    const elRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
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
      }
    );

    if (elRes.ok) {
      const audio = await elRes.arrayBuffer();
      return new Response(audio, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
        },
      });
    }

    const detail = await elRes.text();
    console.error("ElevenLabs TTS error:", elRes.status, detail);
    // fall through to OpenAI if EL fails
  }

  // ── OpenAI (fallback / primary when no EL key) ───────────────────────────
  if (!openaiKey) {
    return new Response("TTS not configured", { status: 503 });
  }

  const safeVoice = VALID_OPENAI_VOICES.has(voice) ? voice : "onyx";

  const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1-hd",
      voice: safeVoice,
      input: text,
    }),
  });

  if (!ttsResponse.ok) {
    const detail = await ttsResponse.text();
    console.error("OpenAI TTS error:", ttsResponse.status, detail);
    return new Response("TTS generation failed", { status: 502 });
  }

  const audio = await ttsResponse.arrayBuffer();
  return new Response(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
