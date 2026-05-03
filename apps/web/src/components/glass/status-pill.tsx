import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type StatusVariant =
  | "active"
  | "paused"
  | "pending"
  | "approved"
  | "rejected"
  | "error"
  | "info"
  | "neutral";

const variants: Record<StatusVariant, string> = {
  active:
    "bg-success-bg text-success-text border-success-border shadow-[0_0_20px_rgba(74,222,128,0.15)]",
  approved:
    "bg-success-bg text-success-text border-success-border",
  paused: "bg-glass-medium text-text-secondary border-border-default",
  pending:
    "bg-warning-bg text-warning-text border-warning-border shadow-[0_0_20px_rgba(251,191,36,0.15)]",
  rejected:
    "bg-danger-bg text-danger-text border-danger-border",
  error:
    "bg-danger-bg text-danger-text border-danger-border shadow-[0_0_20px_rgba(248,113,113,0.15)]",
  info: "bg-info-bg text-info-text border-info-border shadow-[0_0_20px_rgba(56,189,248,0.15)]",
  neutral: "bg-glass-light text-text-tertiary border-border-default",
};

export interface StatusPillProps {
  variant: StatusVariant;
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}

export function StatusPill({ variant, children, pulse = false, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "text-[10px] font-mono uppercase tracking-[0.18em] font-medium",
        "border",
        variants[variant],
        className,
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-50 animate-ping" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
