"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { orders, OrderDetail, OrderStatus } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const STATUS_LABEL_KEYS: Record<OrderStatus, TranslationKey> = {
  PENDING: "orders_status_pending_label",
  CONFIRMED: "orders_status_confirmed_label",
  PREPARING: "orders_status_preparing",
  SHIPPED: "orders_status_shipped",
  DELIVERED: "orders_status_delivered",
  CANCELLED: "orders_status_cancelled_label",
  BLOCKED: "orders_status_blocked_label",
};

const STATUS_TONE: Record<OrderStatus, "success" | "warning" | "danger" | "info" | "neutral" | "accent"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  PREPARING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  BLOCKED: "danger",
};

const STATUS_ACTION_KEYS: { labelKey: TranslationKey; status: OrderStatus }[] = [
  { labelKey: "orders_action_mark_confirmed", status: "CONFIRMED" },
  { labelKey: "orders_action_prepare", status: "PREPARING" },
  { labelKey: "orders_action_ship", status: "SHIPPED" },
  { labelKey: "orders_action_deliver", status: "DELIVERED" },
  { labelKey: "orders_action_cancel", status: "CANCELLED" },
];

const SMS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  SENT: "success",
  PENDING: "warning",
  FAILED: "danger",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string, withTime = true) {
  return new Date(iso).toLocaleString(
    "tr-TR",
    withTime
      ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "short", year: "numeric" }
  );
}

function getToken() {
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const id = parseInt(params["id"] as string);
    if (isNaN(id)) {
      router.push("/orders");
      return;
    }
    orders
      .get(id)
      .then(({ order }) => setOrder(order))
      .catch(() => router.push("/orders"))
      .finally(() => setLoading(false));
  }, [params, router]);

  async function changeStatus(status: OrderStatus) {
    if (!order) return;
    setUpdatingStatus(status);
    try {
      const token = getToken();
      const res = await fetch(`${API}/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("orders_error_status_update"));
      setOrder(data.order);
      showToast(t("orders_toast_status_updated").replace("{label}", t(STATUS_LABEL_KEYS[status])), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function resendSMS() {
    if (!order) return;
    setResending(true);
    try {
      const token = getToken();
      const res = await fetch(`${API}/orders/${order.id}/resend-sms`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("orders_error_sms_send"));
      showToast(t("orders_toast_sms_queued"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
        <p className="text-[14px] text-[var(--color-fg-faint)]">{t("loading")}</p>
      </div>
    );
  }
  if (!order) return null;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
      <button
        type="button"
        onClick={() => router.push("/orders")}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
      >
        <ArrowLeft size={14} aria-hidden />
        {t("orders_back_label")}
      </button>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-[var(--color-fg)]"
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "var(--tracking-display)",
              margin: 0,
            }}
          >
            {t("orders_detail_heading").replace("{id}", String(order.id))}
          </h1>
          {order.shopifyOrderId && (
            <p className="mt-1 font-mono text-[13px] text-[var(--color-fg-muted)]">
              Shopify #{order.shopifyOrderId}
            </p>
          )}
        </div>
        <Badge tone={STATUS_TONE[order.status]} className="text-[12px] px-3 py-1">
          {t(STATUS_LABEL_KEYS[order.status])}
        </Badge>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("orders_modal_info_section")}</CardTitle>
            </CardHeader>
            <dl className="divide-y divide-[var(--color-border)]">
              {[
                [t("orders_detail_customer"), order.customerName],
                [t("orders_detail_phone"), order.customerPhone],
                [t("orders_field_amount"), formatCurrency(order.total)],
                [
                  t("orders_detail_shop"),
                  order.shop.name +
                    (order.shop.shopDomain ? ` · ${order.shop.shopDomain}` : ""),
                ],
                [t("orders_detail_date"), formatDate(order.createdAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <dt className="text-[13px] text-[var(--color-fg-muted)]">{label}</dt>
                  <dd className="text-[14px] font-medium text-[var(--color-fg)] tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("orders_sms_logs")}</CardTitle>
              {order.status === "PENDING" && (
                <Button size="sm" variant="secondary" loading={resending} onClick={resendSMS}>
                  <RefreshCcw size={14} aria-hidden />
                  {t("common_resend")}
                </Button>
              )}
            </CardHeader>
            {order.smsLogs.length === 0 ? (
              <p className="text-[13px] text-[var(--color-fg-faint)]">{t("orders_empty_sms")}</p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {order.smsLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium text-[var(--color-fg)] tabular-nums">
                        {log.phone}
                      </span>
                      <div className="flex items-center gap-2 text-[12px] text-[var(--color-fg-faint)]">
                        <span className="tabular-nums">{formatDate(log.createdAt)}</span>
                        <Badge tone={SMS_TONE[log.status] ?? "neutral"}>{log.status}</Badge>
                      </div>
                    </div>
                    <p className="break-all text-[13px] text-[var(--color-fg-muted)]">
                      {log.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>{t("orders_modal_update_status")}</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-2">
              {STATUS_ACTION_KEYS.filter((a) => a.status !== order.status).map((a) => {
                const isCancel = a.status === "CANCELLED";
                const isConfirm = a.status === "CONFIRMED";
                return (
                  <Button
                    key={a.status}
                    size="md"
                    block
                    variant={isConfirm ? "primary" : "secondary"}
                    loading={updatingStatus === a.status}
                    disabled={updatingStatus !== null}
                    onClick={() => changeStatus(a.status)}
                    className={cn(isCancel && "text-[var(--color-danger)]")}
                  >
                    {t(a.labelKey)}
                  </Button>
                );
              })}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
