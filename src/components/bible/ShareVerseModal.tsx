"use client";

import { useState } from "react";
import { X, Download, Share2, Copy, Check, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { formatReference } from "@/lib/bible-books";
import { cn } from "@/lib/utils";

interface ShareVerseModalProps {
  verse: number;
  verseEnd?: number;
  text: string;
  translation: string;
  book: number;
  chapter: number;
  onClose: () => void;
}

// ─── Canvas card generator ────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function generateCard(
  text: string,
  reference: string,
  translation: string,
  isDark: boolean
): Promise<string> {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  if (isDark) {
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e1b4b");
  } else {
    grad.addColorStop(0, "#fffdf4");
    grad.addColorStop(1, "#dbeafe");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Inner border
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, W - 88, H - 88);

  // Decorative large quote mark
  ctx.font = "bold 340px Georgia, 'Times New Roman', serif";
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  ctx.textAlign = "left";
  ctx.fillText("“", 72, 400);

  // Verse text — dynamic font size
  const fontSize = text.length > 200 ? 34 : text.length > 130 ? 40 : text.length > 80 ? 46 : 52;
  ctx.font = `${fontSize}px Georgia, 'Times New Roman', serif`;
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.93)" : "rgba(15,23,42,0.92)";
  ctx.textAlign = "center";

  const maxWidth = W - 200;
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.55;
  const totalH = lines.length * lineHeight;
  const startY = (H - totalH - 140) / 2 + 50;

  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineHeight);
  });

  // Divider line
  const divY = startY + totalH + 48;
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, divY);
  ctx.lineTo(W / 2 + 60, divY);
  ctx.stroke();

  // Reference + translation
  const refFontSize = Math.max(fontSize - 16, 24);
  ctx.font = `${refFontSize}px -apple-system, Helvetica, Arial, sans-serif`;
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.52)" : "rgba(15,23,42,0.50)";
  ctx.fillText(`${reference}  ·  ${translation}`, W / 2, divY + 52);

  // App branding
  ctx.font = "20px -apple-system, Helvetica, Arial, sans-serif";
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.16)";
  ctx.fillText("PARAKLETOS", W / 2, H - 52);

  return canvas.toDataURL("image/png");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShareVerseModal({
  verse,
  verseEnd,
  text,
  translation,
  book,
  chapter,
  onClose,
}: ShareVerseModalProps) {
  const [isDark, setIsDark] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

  const ref = formatReference(book, chapter, verse, verseEnd);
  const shareText = `"${text}" — ${ref} (${translation})`;

  async function handleCopyText() {
    await navigator.clipboard.writeText(shareText);
    setTextCopied(true);
    toast.success("Verse copied");
    setTimeout(() => setTextCopied(false), 2000);
  }

  async function handleDownload() {
    setGenerating(true);
    try {
      const dataUrl = await generateCard(text, ref, translation, isDark);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${ref.replace(/\s+/g, "-")}.png`;
      a.click();
    } catch {
      toast.error("Failed to generate image");
    } finally {
      setGenerating(false);
    }
  }

  async function handleShare() {
    if (typeof navigator.share === "undefined") return;
    setGenerating(true);
    try {
      const dataUrl = await generateCard(text, ref, translation, isDark);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${ref.replace(/\s+/g, "-")}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: ref, text: shareText });
      } else {
        await navigator.share({ title: ref, text: shareText });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error("Share failed");
    } finally {
      setGenerating(false);
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share !== "undefined";

  // ── Card preview colours ───────────────────────────────────────────────────
  const cardBg = isDark
    ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)"
    : "linear-gradient(135deg, #fffdf4 0%, #dbeafe 100%)";
  const verseColor = isDark ? "rgba(255,255,255,0.93)" : "rgba(15,23,42,0.92)";
  const refColor = isDark ? "rgba(255,255,255,0.52)" : "rgba(15,23,42,0.50)";
  const quoteColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const dividerColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)";
  const brandColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="font-semibold text-base">Share Verse</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card preview */}
        <div className="p-4">
          <div
            className="relative aspect-square w-full rounded-xl overflow-hidden select-none"
            style={{ background: cardBg }}
          >
            {/* Inner border */}
            <div
              className="absolute inset-[10px] rounded-lg border pointer-events-none"
              style={{ borderColor }}
            />

            {/* Decorative quote mark */}
            <span
              className="absolute -top-4 left-4 font-serif leading-none pointer-events-none"
              style={{ fontSize: "7rem", color: quoteColor }}
              aria-hidden
            >
              &ldquo;
            </span>

            {/* Verse content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-7 text-center gap-3">
              <p
                className="font-serif leading-relaxed text-sm sm:text-base"
                style={{ color: verseColor }}
              >
                {text}
              </p>
              <div className="w-10 h-px" style={{ background: dividerColor }} />
              <p className="text-[11px] sm:text-xs tracking-wide" style={{ color: refColor }}>
                {ref} · {translation}
              </p>
            </div>

            {/* Branding */}
            <p
              className="absolute bottom-3 w-full text-center text-[9px] tracking-[0.2em] uppercase"
              style={{ color: brandColor }}
            >
              Parakletos
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 pb-5 space-y-3 shrink-0">
          {/* Theme toggle */}
          <div className="flex justify-center">
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm hover:bg-muted transition-colors"
            >
              {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              <span>{isDark ? "Dark" : "Light"}</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className={cn("grid gap-2", canNativeShare ? "grid-cols-3" : "grid-cols-2")}>
            <ActionBtn
              icon={textCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              label={textCopied ? "Copied!" : "Copy Text"}
              onClick={handleCopyText}
              active={textCopied}
            />
            <ActionBtn
              icon={<Download className="h-4 w-4" />}
              label={generating ? "Saving…" : "Download"}
              onClick={handleDownload}
              disabled={generating}
            />
            {canNativeShare && (
              <ActionBtn
                icon={<Share2 className="h-4 w-4" />}
                label="Share"
                onClick={handleShare}
                disabled={generating}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-sm font-medium transition-colors",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "hover:bg-muted text-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
