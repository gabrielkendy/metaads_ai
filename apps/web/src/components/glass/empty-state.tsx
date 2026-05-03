import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <GlassCard className={cn("p-10 text-center", className)}>
      {Icon && (
        <div className="mx-auto w-14 h-14 rounded-2xl bg-glass-light border border-border-default flex items-center justify-center mb-5">
          <Icon className="w-6 h-6 text-text-tertiary" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-h4 mb-2">{title}</h3>
      {description && (
        <p className="text-body-sm text-text-secondary max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </GlassCard>
  );
}
