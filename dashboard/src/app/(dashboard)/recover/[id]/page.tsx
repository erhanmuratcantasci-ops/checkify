"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { RecoveryTimeline, type RecoveryEvent } from "@/components/recover/RecoveryTimeline";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const STATUS_TONE: Record<string, StatusTone> = {
  abandoned: "warning",
  recovering: "info",
  recovered: "success",
  expired: "neutral",
};

interface CartDetail {
  id: string;
  cartToken: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerName: string | null;
  cartValue: number;
  currency: string;
  lineItems: unknown;
  abandonedAt: string;
  recoveredAt: string | null;
  recoveredOrderId: number | null;
  status: string;
  shop?: { id: number; name: string } | null;
  events: RecoveryEvent[];
}

function getToken() {
  if (typeof window === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface LineItem {
  title?: string;
  quantity?: number;
  price?: string | number;
}

export default function RecoverCartDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [cart, setCart] = useState<CartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<"sms" | "email" | null>(null);

  const STATUS_LABELS: Record<string, string> = {
    abandoned: t("recover_status_abandoned"),
    recovering: t("recover_status_recovering"),
    recovered: t("recover_status_recovered"),
    expired: t("recover_status_expired"),
  };

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API}/abandoned-carts/${id}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.cart) setCart(data.cart);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [params, router]);

  async function sendManual(channel: "sms" | "email") {
    if (!cart) return;
    setSending(channel);
    try {
      const res = await fetch(`${API}/abandoned-carts/${cart.id}/send-manual`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ channel, template: "manual_reminder" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      showToast(t("recover_send_manual_sent"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setSending(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-6 py-10">
        <p className="text-[14px] text-[var(--color-fg-faint)]">{t("recover_loading")}</p>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-6 py-10">
        <p className="text-[14px] text-[var(--color-fg-faint)]">{t("recover_not_found")}</p>
        <Link
          href="/recover"
          className="mt-4 inline-flex text-[13px] text-[var(--color-accent)]"
        >
          {t("recover_back_list")}
        </Link>
      </div>
    );
  }

  const lineItems = Array.isArray(cart.lineItems) ? (cart.lineItems as LineItem[]) : [];

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-8 md:px-10 md:py-10">
      <Link
        href="/recover"
        className="mb-3 inline-flex text-[13px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
      >
        {t("recover_back_list")}
      </Link>

      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1
            className="text-[var(--color-fg)]"
            style={{ fontSize: 28, fontWeight: 500, letterSpacing: "var(--tracking-display)", margin: 0 }}
          >
            {t("recover_detail_title")}
          </h1>
          <p className="mt-1 font-mono text-[12px] text-[var(--color-fg-muted)]">
            {cart.cartToken.slice(0, 16)}…
          </p>
        </div>
        <Badge tone={STATUS_TONE[cart.status] ?? "neutral"}>
          {STATUS_LABELS[cart.status] || cart.status}
        </Badge>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
            {t("recover_detail_customer")}
          </p>
          <dl className="grid grid-cols-1 gap-3">
            <Row label={t("recover_detail_name")} value={cart.customerName || "—"} />
            <Row label={t("recover_detail_email")} value={cart.customerEmail || "—"} />
            <Row label={t("recover_detail_phone")} value={cart.customerPhone || "—"} />
            <Row label={t("recover_detail_shop")} value={cart.shop?.name || "—"} />
          </dl>
        </Card>

        <Card className="p-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
            {t("recover_detail_value")}
          </p>
          <p className="text-[26px] font-medium tabular-nums text-[var(--color-fg)]">
            {formatCurrency(cart.cartValue, cart.currency)}
          </p>
          <dl className="mt-4 grid grid-cols-1 gap-2 text-[13px]">
            <Row
              label={t("recover_detail_abandoned_at")}
              value={formatDateTime(cart.abandonedAt)}
            />
            {cart.recoveredAt && (
              <Row
                label={t("recover_detail_recovered_at")}
                value={formatDateTime(cart.recoveredAt)}
              />
            )}
            {cart.recoveredOrderId != null && (
              <Row
                label={t("recover_detail_recovered_order")}
                value={`#${cart.recoveredOrderId}`}
              />
            )}
          </dl>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <p className="mb-3 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
          {t("recover_lineitems_title")}
        </p>
        {lineItems.length === 0 ? (
          <p className="text-[13px] text-[var(--color-fg-faint)]">
            {t("recover_lineitems_empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {lineItems.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-[13px] text-[var(--color-fg)]"
              >
                <span>
                  {item.title ?? "—"}
                  {item.quantity ? ` × ${item.quantity}` : null}
                </span>
                {item.price != null && (
                  <span className="tabular-nums text-[var(--color-fg-muted)]">
                    {String(item.price)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4 p-5">
        <p className="mb-3 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
          {t("recover_timeline_title")}
        </p>
        <RecoveryTimeline events={cart.events} />
      </Card>

      {cart.status !== "recovered" && cart.status !== "expired" && (
        <Card className="mt-4 p-5">
          <p className="mb-3 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
            {t("recover_send_manual_title")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={sending === "sms"}
              disabled={!cart.customerPhone || sending !== null}
              onClick={() => sendManual("sms")}
            >
              {t("recover_send_manual_sms")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={sending === "email"}
              disabled={!cart.customerEmail || sending !== null}
              onClick={() => sendManual("email")}
            >
              {t("recover_send_manual_email")}
            </Button>
            {!cart.customerEmail && !cart.customerPhone && (
              <span className="text-[12px] text-[var(--color-fg-muted)]">
                {t("recover_send_manual_unavailable")}
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[12px] text-[var(--color-fg-muted)]">{label}</dt>
      <dd className="text-[13px] font-medium text-[var(--color-fg)]">{value}</dd>
    </div>
  );
}
