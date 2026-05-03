"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative group inline-flex items-center justify-center gap-2",
    "rounded-xl font-medium",
    "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "active:scale-[0.98]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
    "outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-brand-500 text-white",
          "shadow-[0_0_0_1px_rgba(61,90,254,0.5),0_4px_16px_rgba(61,90,254,0.3)]",
          "hover:bg-brand-600 hover:shadow-[0_0_0_1px_rgba(61,90,254,0.7),0_8px_24px_rgba(61,90,254,0.5)]",
        ].join(" "),
        glass: [
          "bg-glass-medium border border-border-default text-text-primary",
          "hover:bg-glass-heavy hover:border-border-strong",
        ].join(" "),
        ghost:
          "text-text-secondary hover:text-text-primary hover:bg-glass-light",
        danger: [
          "bg-danger-bg text-danger-text border border-danger-border",
          "hover:bg-[rgba(248,113,113,0.15)] hover:border-danger-text",
        ].join(" "),
        success: [
          "bg-success-bg text-success-text border border-success-border",
          "hover:bg-[rgba(74,222,128,0.15)]",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 text-body-sm",
        default: "h-10 px-5 text-body",
        lg: "h-12 px-6 text-body-lg",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface GlassButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, asChild, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {variant === "primary" && (
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-xl pointer-events-none" />
        )}
        {children}
      </Comp>
    );
  },
);

GlassButton.displayName = "GlassButton";

export { buttonVariants };
