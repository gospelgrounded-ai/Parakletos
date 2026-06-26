import { NextResponse } from "next/server";

const OPENAI_VOICES = [
  { id: "onyx", name: "Onyx" },
  { id: "nova", name: "Nova" },
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "shimmer", name: "Shimmer" },
];

export const revalidate = 3600;

export async function GET() {
  const elKey = process.env.ELEVENLABS_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (elKey) {
    try {
      const res = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": elKey },
      });
      if (res.ok) {
        const data = await res.json();
        const voices = (data.voices ?? []).map((v: { voice_id: string; name: string; description?: string }) => ({
          id: v.voice_id,
          name: v.name,
          description: v.description ?? "",
        }));
        const defaultVoice =
          voices.find((v: { name: string }) => v.name === "Adam")?.id ??
          voices.find((v: { name: string }) => v.name === "Antoni")?.id ??
          voices[0]?.id ??
          "";
        return NextResponse.json({
          service: "elevenlabs",
          voices,
          defaultVoice,
        });
      }
    } catch {
      // fall through to OpenAI
    }
  }

  if (openaiKey) {
    return NextResponse.json({
      service: "openai",
      voices: OPENAI_VOICES,
      defaultVoice: "onyx",
    });
  }

  return NextResponse.json({ service: null, voices: [], defaultVoice: "" });
}
