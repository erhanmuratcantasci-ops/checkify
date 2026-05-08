import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-16",
        className
      )}
      {...props}
    >
      {Icon && (
        <Icon
          aria-hidden
          size={40}
          strokeWidth={1.5}
          className="mb-4 text-[var(--color-fg-faint)]"
        />
      )}
      <h3
        className="text-[var(--color-fg)]"
        style={{
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: "var(--tracking-heading)",
        }}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-[14px] text-[var(--color-fg-muted)]">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
