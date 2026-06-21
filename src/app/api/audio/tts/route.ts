import { NextRequest } from "next/server";

const VALID_VOICES = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]);
const MAX_TEXT_LENGTH = 4096;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("TTS not configured", { status: 503 });
  }

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

  const safeVoice = VALID_VOICES.has(voice) ? voice : "onyx";

  const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
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
