import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  aura?: boolean;
  hoverable?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, aura = false, hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl",
          "bg-glass-light backdrop-blur-xl",
          "border border-border-default",
          "shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_8px_32px_-8px_rgba(0,0,0,0.5)]",
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          hoverable &&
            "hover:bg-glass-medium hover:border-border-strong hover:-translate-y-0.5",
          aura && "glass-aura",
          className,
        )}
        {...props}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-2xl" />
        {children}
      </div>
    );
  },
);

GlassCard.displayName = "GlassCard";
