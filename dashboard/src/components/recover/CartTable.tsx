"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const STATUS_TONE: Record<string, StatusTone> = {
  abandoned: "warning",
  recovering: "info",
  recovered: "success",
  expired: "neutral",
};

export interface RecoverCartRow {
  id: string;
  cartToken: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerName: string | null;
  cartValue: number;
  currency: string;
  abandonedAt: string;
  recoveredAt: string | null;
  recoveredOrderId: number | null;
  status: string;
  shop?: { id: number; name: string } | null;
  _count?: { events: number };
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency || "TRY",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CartTable({ carts }: { carts: RecoverCartRow[] }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const STATUS_LABELS: Record<string, string> = {
    abandoned: t("recover_status_abandoned"),
    recovering: t("recover_status_recovering"),
    recovered: t("recover_status_recovered"),
    expired: t("recover_status_expired"),
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2.5">
        {carts.map((cart) => (
          <Card key={cart.id} className="p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-[var(--color-fg)]">
                  {cart.customerName || cart.customerEmail || cart.customerPhone || "—"}
                </p>
                <p className="text-[12px] text-[var(--color-fg-muted)] tabular-nums">
                  {formatDate(cart.abandonedAt)}
                </p>
              </div>
              <Badge tone={STATUS_TONE[cart.status] ?? "neutral"}>
                {STATUS_LABELS[cart.status] || cart.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[var(--color-fg-muted)]">
                {cart.customerPhone || cart.customerEmail || "—"}
              </span>
              <span className="font-medium tabular-nums text-[var(--color-fg)]">
                {formatCurrency(cart.cartValue, cart.currency)}
              </span>
            </div>
            <div className="mt-3 flex justify-end">
              <Link href={`/recover/${cart.id}`}>
                <Button size="sm" variant="secondary">
                  {t("recover_detail_button")}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <THead>
          <TR className="hover:bg-transparent">
            <TH>{t("recover_col_customer")}</TH>
            <TH>{t("recover_col_contact")}</TH>
            <TH className="text-right">{t("recover_col_value")}</TH>
            <TH>{t("recover_col_status")}</TH>
            <TH>{t("recover_col_abandoned_at")}</TH>
            <TH className="text-right">{t("recover_col_events")}</TH>
            <TH className="text-right">{t("recover_col_action")}</TH>
          </TR>
        </THead>
        <TBody>
          {carts.map((cart) => (
            <TR key={cart.id}>
              <TD className="font-medium">
                {cart.customerName || "—"}
              </TD>
              <TD className={cn("text-[var(--color-fg-muted)]")}>
                <div className="flex flex-col">
                  {cart.customerEmail && <span className="text-[12px]">{cart.customerEmail}</span>}
                  {cart.customerPhone && (
                    <span className="text-[12px] tabular-nums">{cart.customerPhone}</span>
                  )}
                  {!cart.customerEmail && !cart.customerPhone && <span>—</span>}
                </div>
              </TD>
              <TD className="text-right tabular-nums font-medium">
                {formatCurrency(cart.cartValue, cart.currency)}
              </TD>
              <TD>
                <Badge tone={STATUS_TONE[cart.status] ?? "neutral"}>
                  {STATUS_LABELS[cart.status] || cart.status}
                </Badge>
              </TD>
              <TD className="text-[var(--color-fg-muted)] tabular-nums">
                {formatDate(cart.abandonedAt)}
              </TD>
              <TD className="text-right tabular-nums">
                {cart._count?.events ?? 0}
              </TD>
              <TD className="text-right">
                <Link href={`/recover/${cart.id}`}>
                  <Button size="sm" variant="secondary">
                    {t("recover_detail_button" as TranslationKey)}
                  </Button>
                </Link>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
