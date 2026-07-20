import { MAX_SOURCES } from "@/lib/commentary-format";

/**
 * Per-device commentary preferences (source selection + focus mode),
 * persisted in localStorage — mirrors the load/save conventions of
 * lib/settings.ts. Deliberately NOT synced to UserSettings: no schema
 * change for a lightweight per-device preference.
 */

export const COMMENTARY_PREFS_KEY = "parakletos-commentary";

export interface CommentaryPrefs {
  version: 1;
  /** Selected helloao source ids; null = server default trio. */
  sources: string[] | null;
  /** Show only the selected verse's entry per source. */
  focus: boolean;
}

export const DEFAULT_COMMENTARY_PREFS: CommentaryPrefs = {
  version: 1,
  sources: null,
  focus: false,
};

const SOURCE_ID_RE = /^[a-z0-9_-]{1,32}$/;

/** Pure validator — safe against arbitrary stored JSON. */
export function normalizeCommentaryPrefs(raw: unknown): CommentaryPrefs {
  if (typeof raw !== "object" || raw === null) return DEFAULT_COMMENTARY_PREFS;
  const obj = raw as Record<string, unknown>;

  let sources: string[] | null = null;
  if (Array.isArray(obj.sources)) {
    const ids = obj.sources
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.toLowerCase())
      .filter((s) => SOURCE_ID_RE.test(s))
      .slice(0, MAX_SOURCES);
    sources = ids.length > 0 ? ids : null;
  }

  return {
    version: 1,
    sources,
    focus: obj.focus === true,
  };
}

export function loadCommentaryPrefs(): CommentaryPrefs {
  if (typeof window === "undefined") return DEFAULT_COMMENTARY_PREFS;
  try {
    const raw = window.localStorage.getItem(COMMENTARY_PREFS_KEY);
    if (!raw) return DEFAULT_COMMENTARY_PREFS;
    return normalizeCommentaryPrefs(JSON.parse(raw));
  } catch {
    return DEFAULT_COMMENTARY_PREFS;
  }
}

export function saveCommentaryPrefs(prefs: CommentaryPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COMMENTARY_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage unavailable (private mode) — preference just won't persist
  }
}
