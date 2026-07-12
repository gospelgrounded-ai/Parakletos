// Generic SOAP-style reflection prompts shown after a reading-plan day is
// marked complete. Rotated by day number — no per-day authoring needed.
export const REFLECTION_PROMPTS: string[] = [
  "What does this passage teach you about who God is?",
  "Is there a promise here to hold onto, or a command to obey?",
  "How does this passage point to Jesus?",
  "What's one thing you can apply to your life today?",
  "Who could you share this passage with?",
  "What questions does this passage raise for you?",
  "How does this compare with what you already believe?",
  "Write a one-sentence prayer inspired by today's reading.",
  "What word or phrase stood out to you, and why?",
  "How does this passage encourage or challenge you?",
];

export function getReflectionPrompt(dayNumber: number): string {
  const idx = ((dayNumber - 1) % REFLECTION_PROMPTS.length + REFLECTION_PROMPTS.length) % REFLECTION_PROMPTS.length;
  return REFLECTION_PROMPTS[idx];
}
