import * as React from "react";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface OrderSummaryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  shopName?: string;
  customerName: string;
  orderId: number;
  total: number;
  createdAt?: string;
}

/**
 * Apple-Wallet-style summary tile shown to the customer after / during the
 * confirm flow. Compact 13–14px type, rounded edges, single coral accent
 * line at the top so it reads like a ticket.
 */
export function OrderSummaryCard({
  className,
  shopName,
  customerName,
  orderId,
  total,
  createdAt,
  ...props
}: OrderSummaryCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-4 shadow-[var(--shadow-md)]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-70"
      />

      <div className="flex items-baseline justify-between gap-3">
        {shopName && (
          <p className="truncate text-[12px] uppercase tracking-[0.06em] text-[var(--color-accent)]">
            {shopName}
          </p>
        )}
        <p className="font-mono text-[12px] text-[var(--color-fg-faint)] tabular-nums">
          #{orderId}
        </p>
      </div>

      <p className="mt-2 text-[14px] text-[var(--color-fg-muted)]">
        {customerName}
      </p>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span
          className="text-[var(--color-fg)] tabular-nums"
          style={{
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            lineHeight: 1.1,
          }}
        >
          {formatCurrency(total)}
        </span>
        {createdAt && (
          <span className="text-[12px] text-[var(--color-fg-faint)] tabular-nums">
            {formatDate(createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}
