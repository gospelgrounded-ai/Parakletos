export const OPENAI_VOICES = [
  { id: "onyx", name: "Onyx" },
  { id: "nova", name: "Nova" },
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "shimmer", name: "Shimmer" },
];

export interface VoiceOption {
  id: string;
  name: string;
  description?: string;
}

export interface VoiceCatalog {
  service: "elevenlabs" | "openai" | null;
  voices: VoiceOption[];
  defaultVoice: string;
}

// In-memory cache — lives only for the duration of a warm serverless instance,
// so this is a latency optimization, not a source of truth.
let cached: { data: VoiceCatalog; expiresAt: number } | null = null;

export async function getVoiceCatalog(): Promise<VoiceCatalog> {
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const elKey = process.env.ELEVENLABS_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (elKey) {
    try {
      const res = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": elKey },
      });
      if (res.ok) {
        const data = await res.json();
        const voices: VoiceOption[] = (data.voices ?? []).map(
          (v: { voice_id: string; name: string; description?: string }) => ({
            id: v.voice_id,
            name: v.name,
            description: v.description ?? "",
          })
        );
        if (voices.length > 0) {
          const defaultVoice =
            voices.find((v) => v.name === "Adam")?.id ??
            voices.find((v) => v.name === "Antoni")?.id ??
            voices[0].id;
          const result: VoiceCatalog = { service: "elevenlabs", voices, defaultVoice };
          cached = { data: result, expiresAt: Date.now() + 60 * 60 * 1000 };
          return result;
        }
      }
    } catch {
      // fall through to OpenAI
    }
  }

  if (openaiKey) {
    const result: VoiceCatalog = { service: "openai", voices: OPENAI_VOICES, defaultVoice: "onyx" };
    cached = { data: result, expiresAt: Date.now() + 60 * 60 * 1000 };
    return result;
  }

  const result: VoiceCatalog = { service: null, voices: [], defaultVoice: "" };
  cached = { data: result, expiresAt: Date.now() + 30 * 1000 };
  return result;
}
