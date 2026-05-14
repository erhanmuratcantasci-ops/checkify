"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

const DEFAULT_COLUMNS = [
  "order_id",
  "created_at",
  "customer_name",
  "phone",
  "address",
  "city",
  "postal_code",
  "status",
  "total",
  "items_json",
  "fraud_score",
  "recovered_from_cart",
] as const;

type Column = (typeof DEFAULT_COLUMNS)[number];

interface Props {
  columns?: readonly string[];
}

/**
 * Lightweight column reorder UI. V1 — order is local state only, server is
 * not notified. V2 persists in IntegrationConfig.columnOrder.
 */
export function ColumnMapper({ columns }: Props) {
  const { t } = useTranslation();
  const initial = (columns?.length ? columns : DEFAULT_COLUMNS) as readonly Column[];
  const [order, setOrder] = useState<Column[]>(initial as Column[]);

  function move(idx: number, dir: -1 | 1) {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setOrder(next);
  }

  return (
    <Card>
      <CardTitle>{t("integrations_column_mapper_title")}</CardTitle>
      <CardDescription className="mt-1">{t("integrations_column_order_hint")}</CardDescription>

      <ol className="mt-4 space-y-1">
        {order.map((col, idx) => (
          <li
            key={col}
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          >
            <GripVertical
              size={14}
              strokeWidth={1.75}
              className="text-[var(--color-fg-faint)]"
              aria-hidden
            />
            <span className="w-6 text-right text-[12px] tabular-nums text-[var(--color-fg-muted)]">
              {idx + 1}
            </span>
            <code className="flex-1 font-mono text-[12px] text-[var(--color-fg)]">{col}</code>
            <button
              type="button"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30"
              aria-label="up"
            >
              <ArrowUp size={14} strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => move(idx, 1)}
              disabled={idx === order.length - 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] disabled:opacity-30"
              aria-label="down"
            >
              <ArrowDown size={14} strokeWidth={1.75} aria-hidden />
            </button>
          </li>
        ))}
      </ol>
    </Card>
  );
}
