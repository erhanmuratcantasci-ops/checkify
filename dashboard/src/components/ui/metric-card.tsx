import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaTone?: Tone;
  hint?: React.ReactNode;
}

const toneClass: Record<Tone, string> = {
  neutral: "text-[var(--color-fg-muted)] bg-[var(--color-surface)]",
  success: "text-[var(--color-success)] bg-[var(--color-success)]/[0.08]",
  warning: "text-[var(--color-warning)] bg-[var(--color-warning)]/[0.08]",
  danger: "text-[var(--color-danger)] bg-[var(--color-danger)]/[0.08]",
};

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, label, value, delta, deltaTone = "neutral", hint, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] p-5",
        className
      )}
      {...props}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] tracking-[-0.005em] text-[var(--color-fg-muted)]">
          {label}
        </span>
        {delta && (
          <span
            className={cn(
              "rounded-[var(--radius-full)] px-2 py-0.5 text-[11px] font-medium",
              toneClass[deltaTone]
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <div
        className="mt-2 text-[var(--color-fg)]"
        style={{
          fontSize: 32,
          fontWeight: 500,
          letterSpacing: "var(--tracking-display)",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-2 text-[12px] text-[var(--color-fg-faint)]">{hint}</div>
      )}
    </div>
  )
);
MetricCard.displayName = "MetricCard";
