"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  type ParakletosSettings,
  type FontFamily,
  DEFAULT_SETTINGS,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  FONT_SIZE_STEP,
  loadLocalSettings,
  saveLocalSettings,
  fetchDbSettings,
  pushDbSettings,
} from "@/lib/settings";

export type { FontFamily };
export interface ReaderSettings {
  fontSize: number; // rem * 100, e.g. 112 = 1.12rem
  fontFamily: FontFamily;
}

export function useReaderSettings() {
  const { status } = useSession();
  const [settings, setSettings] = useState<ParakletosSettings>(DEFAULT_SETTINGS);
  const hydratedFromDb = useRef(false);

  // Hydrate from localStorage right after mount (avoids SSR mismatch), then
  // prefer the DB copy — the cross-device source of truth — once we know
  // the user is signed in.
  useEffect(() => {
    setSettings(loadLocalSettings());
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || hydratedFromDb.current) return;
    hydratedFromDb.current = true;
    fetchDbSettings().then((db) => {
      if (db) {
        setSettings(db);
        saveLocalSettings(db);
      }
    });
  }, [status]);

  function update(patch: Partial<ParakletosSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveLocalSettings(next);
      if (status === "authenticated") pushDbSettings(next);
      return next;
    });
  }

  function increaseFontSize() {
    update({ fontSize: Math.min(settings.fontSize + FONT_SIZE_STEP, MAX_FONT_SIZE) });
  }

  function decreaseFontSize() {
    update({ fontSize: Math.max(settings.fontSize - FONT_SIZE_STEP, MIN_FONT_SIZE) });
  }

  function setFontFamily(fontFamily: FontFamily) {
    update({ fontFamily });
  }

  return {
    settings,
    increaseFontSize,
    decreaseFontSize,
    setFontFamily,
    canIncrease: settings.fontSize < MAX_FONT_SIZE,
    canDecrease: settings.fontSize > MIN_FONT_SIZE,
  };
}
