import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  className?: string;
}

/** The one progress bar — h-1.5, token colors, clamped. */
export default function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full rounded-full bg-muted overflow-hidden", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
