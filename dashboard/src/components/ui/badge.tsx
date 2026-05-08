import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2 py-0.5 text-[11px] font-medium leading-none",
  {
    variants: {
      tone: {
        neutral:
          "bg-[var(--color-surface)] text-[var(--color-fg-muted)] border border-[var(--color-border)]",
        accent:
          "bg-[var(--color-accent-faded)] text-[var(--color-accent)] border border-[var(--color-accent)]/20",
        success:
          "bg-[var(--color-success)]/[0.12] text-[var(--color-success)] border border-[var(--color-success)]/20",
        warning:
          "bg-[var(--color-warning)]/[0.12] text-[var(--color-warning)] border border-[var(--color-warning)]/20",
        danger:
          "bg-[var(--color-danger)]/[0.12] text-[var(--color-danger)] border border-[var(--color-danger)]/20",
        info:
          "bg-[#3b82f6]/[0.12] text-[#60a5fa] border border-[#3b82f6]/20",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
