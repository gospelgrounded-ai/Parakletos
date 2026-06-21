"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Check, Save } from "lucide-react";
import { FEATURED_TRANSLATIONS } from "@/lib/bible-api";

const FONT_FAMILIES = [
  { value: "serif", label: "Serif (Georgia)" },
  { value: "sans-serif", label: "Sans-serif (System)" },
] as const;
type FontFamily = (typeof FONT_FAMILIES)[number]["value"];

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

interface Settings {
  fontSize: number;
  fontFamily: FontFamily;
  defaultTranslation: string;
}

const SETTINGS_KEY = "parakletos-settings";

function loadSettings(): Settings {
  if (typeof window === "undefined") {
    return { fontSize: 18, fontFamily: "serif", defaultTranslation: "KJV" };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as Settings;
  } catch {
    // ignore parse errors
  }
  return { fontSize: 18, fontFamily: "serif", defaultTranslation: "KJV" };
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Settings>({
    fontSize: 18,
    fontFamily: "serif",
    defaultTranslation: "KJV",
  });
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function handleSave() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="space-y-8">
        {/* Reading experience */}
        <section className="space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Reading
          </h2>
          <div className="rounded-xl border divide-y">
            {/* Font size */}
            <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label
                  htmlFor="font-size"
                  className="text-sm font-medium block"
                >
                  Font Size
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current: {settings.fontSize}px
                </p>
              </div>
              <input
                id="font-size"
                type="range"
                min={16}
                max={24}
                step={1}
                value={settings.fontSize}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    fontSize: Number(e.target.value),
                  }))
                }
                className="w-full sm:w-48 accent-primary"
              />
            </div>

            {/* Font family */}
            <div className="p-4 flex items-center justify-between">
              <label htmlFor="font-family" className="text-sm font-medium">
                Font Family
              </label>
              <select
                id="font-family"
                value={settings.fontFamily}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    fontFamily: e.target.value as FontFamily,
                  }))
                }
                className={cn(
                  "rounded-md border bg-background px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50"
                )}
              >
                {FONT_FAMILIES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Default translation */}
            <div className="p-4 flex items-center justify-between">
              <label
                htmlFor="default-translation"
                className="text-sm font-medium"
              >
                Default Translation
              </label>
              <select
                id="default-translation"
                value={settings.defaultTranslation}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    defaultTranslation: e.target.value,
                  }))
                }
                className={cn(
                  "rounded-md border bg-background px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50"
                )}
              >
                {FEATURED_TRANSLATIONS.map(({ short_name, full_name }) => (
                  <option key={short_name} value={short_name}>
                    {short_name} – {full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Appearance
          </h2>
          <div className="rounded-xl border p-4">
            <p className="text-sm font-medium mb-3">Theme</p>
            <div className="flex gap-3 flex-wrap">
              {THEMES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    theme === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  {theme === value && <Check className="h-3.5 w-3.5" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Preview */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </h2>
          <div
            className="rounded-xl border p-5 bg-muted/20"
            style={{
              fontSize: `${settings.fontSize}px`,
              fontFamily: settings.fontFamily,
              lineHeight: 1.8,
            }}
          >
            <p className="text-xs font-sans font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              John 3:16
            </p>
            <p>
              For God so loved the world, that he gave his only begotten Son,
              that whosoever believeth in him should not perish, but have
              everlasting life.
            </p>
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={cn(
            "w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors",
            saved
              ? "bg-green-600 text-white"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
