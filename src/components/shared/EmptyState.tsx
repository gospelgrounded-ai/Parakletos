import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}

/** The one empty-state layout used across library, prayer, sermon notes,
 *  memorize, and plans — icon, title, guiding hint, optional action. */
export default function EmptyState({ icon: Icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-20" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-sm text-muted-foreground mt-1">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
