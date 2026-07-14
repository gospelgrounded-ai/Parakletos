/**
 * Inline audio timestamp markers for sermon notes.
 *
 * Stamps are plain text — `[m:ss]` or `[h:mm:ss]` — living inside the notes
 * body, so they survive copy/paste, export, and the public share page with
 * zero schema. The editor parses them out to drive the tap-to-jump chips
 * under the recorder.
 */

export interface Stamp {
  /** Position in the recording, in whole seconds. */
  seconds: number;
  /** Human label without brackets, e.g. "12:34" or "1:02:03". */
  label: string;
}

export function formatStamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `[${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}]`;
  }
  return `[${m}:${String(sec).padStart(2, "0")}]`;
}

// [m:ss], [mm:ss], [h:mm:ss] — seconds must be two digits 00-59 so prose
// like "[verse 3:4]" or scripture refs (which are never bracketed with a
// leading bare number) don't collide.
const STAMP_RE = /\[(?:(\d{1,2}):)?(\d{1,2}):([0-5]\d)\]/g;

/** Extract stamps from note text, sorted ascending and deduped by second. */
export function parseStamps(text: string): Stamp[] {
  const bySecond = new Map<number, Stamp>();
  let m: RegExpExecArray | null;
  STAMP_RE.lastIndex = 0;
  while ((m = STAMP_RE.exec(text)) !== null) {
    const hours = m[1] ? parseInt(m[1], 10) : 0;
    const minutes = parseInt(m[2], 10);
    const seconds = parseInt(m[3], 10);
    if (m[1] && minutes > 59) continue; // [h:mm:ss] needs valid minutes
    const total = hours * 3600 + minutes * 60 + seconds;
    if (!bySecond.has(total)) {
      bySecond.set(total, {
        seconds: total,
        label: m[0].slice(1, -1),
      });
    }
  }
  return [...bySecond.values()].sort((a, b) => a.seconds - b.seconds);
}
