"use client";

import { useEffect, useState } from "react";

export type FontFamily = "serif" | "sans";

export interface ReaderSettings {
  fontSize: number; // rem * 100, e.g. 112 = 1.12rem
  fontFamily: FontFamily;
}

const STORAGE_KEY = "parakletos-settings";
const DEFAULTS: ReaderSettings = { fontSize: 125, fontFamily: "serif" };
const MIN_SIZE = 80;
const MAX_SIZE = 175;
const STEP = 8;

function load(): ReaderSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<ReaderSettings>;
    return {
      fontSize: parsed.fontSize ?? DEFAULTS.fontSize,
      fontFamily: parsed.fontFamily ?? DEFAULTS.fontFamily,
    };
  } catch {
    return DEFAULTS;
  }
}

function save(s: ReaderSettings) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...s }));
  } catch {
    // ignore
  }
}

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULTS);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setSettings(load());
  }, []);

  function update(patch: Partial<ReaderSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }

  function increaseFontSize() {
    update({ fontSize: Math.min(settings.fontSize + STEP, MAX_SIZE) });
  }

  function decreaseFontSize() {
    update({ fontSize: Math.max(settings.fontSize - STEP, MIN_SIZE) });
  }

  function setFontFamily(fontFamily: FontFamily) {
    update({ fontFamily });
  }

  return {
    settings,
    increaseFontSize,
    decreaseFontSize,
    setFontFamily,
    canIncrease: settings.fontSize < MAX_SIZE,
    canDecrease: settings.fontSize > MIN_SIZE,
  };
}
