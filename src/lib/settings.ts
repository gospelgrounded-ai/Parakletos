// Single source of truth for reader/appearance preferences. Both the reader
// toolbar (useReaderSettings) and the Settings page read and write through
// this module so they can never again disagree about what "fontSize: 18"
// means. Values are cached in localStorage for guests/instant load, and
// synced to the DB (`/api/user/settings`) for authenticated users so
// preferences follow you across devices.

export type FontFamily = "serif" | "sans";
export type ThemePref = "light" | "dark" | "system";

export interface ParakletosSettings {
  version: 2;
  fontSize: number; // percent of base reader size, e.g. 100 = 1.25rem
  fontFamily: FontFamily;
  theme: ThemePref;
  defaultTranslation: string;
}

export const SETTINGS_STORAGE_KEY = "parakletos-settings";

export const DEFAULT_SETTINGS: ParakletosSettings = {
  version: 2,
  fontSize: 100,
  fontFamily: "serif",
  theme: "system",
  defaultTranslation: "KJV",
};

export const MIN_FONT_SIZE = 64;
export const MAX_FONT_SIZE = 140;
export const FONT_SIZE_STEP = 8;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

interface UnknownShape {
  version?: number;
  fontSize?: number;
  fontFamily?: string;
  theme?: string;
  defaultTranslation?: string;
}

/**
 * Pre-v2, two different screens wrote this same localStorage key with
 * incompatible units: the Settings page saved `fontSize` in px (16-24) and
 * `fontFamily: "sans-serif"`; the reader toolbar saved `fontSize` as a
 * percent (64-140) and `fontFamily: "sans"`. Percent values are always
 * well above the px range, so `fontSize <= 24` reliably identifies the
 * legacy px shape.
 */
export function migrate(raw: UnknownShape): ParakletosSettings {
  const isLegacyPx = typeof raw.fontSize === "number" && raw.fontSize <= 24;
  const fontSize = isLegacyPx
    ? clamp(Math.round(((raw.fontSize as number) / 18) * 100), MIN_FONT_SIZE, MAX_FONT_SIZE)
    : clamp(Number(raw.fontSize) || DEFAULT_SETTINGS.fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE);
  const fontFamily: FontFamily = raw.fontFamily === "sans" || raw.fontFamily === "sans-serif" ? "sans" : "serif";
  const theme: ThemePref =
    raw.theme === "light" || raw.theme === "dark" || raw.theme === "system"
      ? raw.theme
      : DEFAULT_SETTINGS.theme;

  return {
    version: 2,
    fontSize,
    fontFamily,
    theme,
    defaultTranslation: raw.defaultTranslation || DEFAULT_SETTINGS.defaultTranslation,
  };
}

export function loadLocalSettings(): ParakletosSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as UnknownShape;
    if (parsed.version === 2) {
      return {
        version: 2,
        fontSize: clamp(Number(parsed.fontSize) || DEFAULT_SETTINGS.fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE),
        fontFamily: parsed.fontFamily === "sans" ? "sans" : "serif",
        theme:
          parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system"
            ? parsed.theme
            : DEFAULT_SETTINGS.theme,
        defaultTranslation: parsed.defaultTranslation || DEFAULT_SETTINGS.defaultTranslation,
      };
    }
    const migrated = migrate(parsed);
    saveLocalSettings(migrated);
    return migrated;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveLocalSettings(settings: ParakletosSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore (private browsing / storage full)
  }
}

/** Fetch the authenticated user's settings from the DB. Null on any failure. */
export async function fetchDbSettings(): Promise<ParakletosSettings | null> {
  try {
    const res = await fetch("/api/user/settings");
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== "object") return null;
    return {
      version: 2,
      fontSize: clamp(Number(data.fontSize) || DEFAULT_SETTINGS.fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE),
      fontFamily: data.fontFamily === "sans" ? "sans" : "serif",
      theme:
        data.theme === "light" || data.theme === "dark" || data.theme === "system"
          ? data.theme
          : DEFAULT_SETTINGS.theme,
      defaultTranslation: data.defaultTranslation || DEFAULT_SETTINGS.defaultTranslation,
    };
  } catch {
    return null;
  }
}

/** Best-effort push to the DB — fire-and-forget, never blocks the UI. */
export function pushDbSettings(settings: ParakletosSettings): void {
  fetch("/api/user/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      theme: settings.theme,
      defaultTranslation: settings.defaultTranslation,
    }),
  }).catch(() => {});
}
