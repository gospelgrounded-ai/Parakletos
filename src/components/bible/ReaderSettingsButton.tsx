"use client";

import { useTheme } from "next-themes";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { type FontFamily, type ReaderSettings } from "@/hooks/useReaderSettings";

interface ReaderSettingsButtonProps {
  settings: ReaderSettings;
  onIncrease: () => void;
  onDecrease: () => void;
  canIncrease: boolean;
  canDecrease: boolean;
  onFontFamily: (f: FontFamily) => void;
}

export default function ReaderSettingsButton({
  settings,
  onIncrease,
  onDecrease,
  canIncrease,
  canDecrease,
  onFontFamily,
}: ReaderSettingsButtonProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
          title="Reading settings"
          aria-label="Reading settings"
        >
          <span className="text-[11px] font-bold leading-none tracking-tight select-none">Aa</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-4 space-y-4" align="center">
        {/* Font size */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Font size
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onDecrease}
              disabled={!canDecrease}
              aria-label="Decrease font size"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <div className="flex-1 text-center text-sm font-medium tabular-nums">
              {Math.round(settings.fontSize)}%
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onIncrease}
              disabled={!canIncrease}
              aria-label="Increase font size"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Typeface */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Typeface
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onFontFamily("serif")}
              className={cn(
                "py-2 px-3 rounded-md border text-sm transition-colors",
                settings.fontFamily === "serif"
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              )}
              style={{ fontFamily: "Georgia, serif" }}
            >
              Serif
            </button>
            <button
              onClick={() => onFontFamily("sans")}
              className={cn(
                "py-2 px-3 rounded-md border text-sm transition-colors",
                settings.fontFamily === "sans"
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              )}
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Sans
            </button>
          </div>
        </div>

        {/* Theme */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Theme
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "py-2 px-1 rounded-md border text-xs capitalize transition-colors",
                  theme === t
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                )}
              >
                {t === "system" ? "Auto" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
