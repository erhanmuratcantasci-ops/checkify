"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Inbox, RefreshCcw, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/Toast";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const STATUS_TONE: Record<string, StatusTone> = {
  PENDING: "warning",
  CONFIRMED: "success",
  PREPARING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  BLOCKED: "danger",
};

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: string;
  shopifyOrderId?: string | null;
}

interface SMSLog {
  id: number;
  phone: string;
  message: string;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
}

interface OrderDetail extends Order {
  shop: { id: number; name: string; shopDomain: string };
  smsLogs: SMSLog[];
}

function getToken() {
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderModal({
  order,
  onClose,
  onUpdate,
}: {
  order: OrderDetail;
  onClose: () => void;
  onUpdate: (updated: OrderDetail) => void;
}) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t("orders_status_pending"),
    CONFIRMED: t("orders_status_confirmed"),
    PREPARING: t("orders_status_preparing"),
    SHIPPED: t("orders_status_shipped"),
    DELIVERED: t("orders_status_delivered"),
    CANCELLED: t("orders_status_cancelled"),
  };

  const STATUS_ACTIONS: { label: string; status: string; tone: StatusTone }[] = [
    { label: t("orders_confirm_action"), status: "CONFIRMED", tone: "success" },
    { label: t("orders_action_prepare"), status: "PREPARING", tone: "info" },
    { label: t("orders_action_ship"), status: "SHIPPED", tone: "info" },
    { label: t("orders_action_deliver"), status: "DELIVERED", tone: "success" },
    { label: t("orders_cancel_action"), status: "CANCELLED", tone: "danger" },
  ];

  async function handleStatusChange(status: string) {
    setUpdatingStatus(status);
    try {
      const res = await fetch(`${API}/orders/${order.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      onUpdate(data.order);
      showToast(`${t("orders_col_status")}: ${STATUS_LABELS[status]}`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleResendSMS() {
    setResending(true);
    try {
      const res = await fetch(`${API}/orders/${order.id}/resend-sms`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      showToast(t("orders_toast_sms_queued"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setResending(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25, ease: easeOut }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-overlay)] shadow-[var(--shadow-lg)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
              {t("orders_detail_title")}
            </p>
            <p
              className="mt-1 text-[var(--color-fg)]"
              style={{ fontSize: 18, fontWeight: 500, letterSpacing: "var(--tracking-heading)" }}
            >
              #{order.id}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label={t("close")}
            className="h-9 w-9 px-0"
          >
            <X size={16} aria-hidden />
          </Button>
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto p-6">
          <section>
            <p className="mb-3 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
              {t("orders_detail_customer")}
            </p>
            <dl className="grid grid-cols-2 gap-3">
              {[
                [t("orders_detail_name"), order.customerName],
                [t("orders_detail_phone"), order.customerPhone],
                [t("orders_detail_total"), formatCurrency(order.total)],
                [t("orders_detail_shop"), order.shop?.name || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[12px] text-[var(--color-fg-muted)]">{label}</dt>
                  <dd className="mt-0.5 text-[14px] font-medium text-[var(--color-fg)]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <p className="mb-3 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
              {t("orders_modal_info_section")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-[12px] text-[var(--color-fg-muted)]">
                  {t("orders_detail_status")}
                </p>
                <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>
                  {STATUS_LABELS[order.status] || order.status}
                </Badge>
              </div>
              <div>
                <p className="text-[12px] text-[var(--color-fg-muted)]">
                  {t("orders_detail_date")}
                </p>
                <p className="mt-0.5 text-[13px] text-[var(--color-fg)] tabular-nums">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              {order.shopifyOrderId && (
                <div className="col-span-2">
                  <p className="text-[12px] text-[var(--color-fg-muted)]">Shopify sipariş ID</p>
                  <p className="mt-0.5 font-mono text-[13px] text-[var(--color-accent)]">
                    #{order.shopifyOrderId}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section>
            <p className="mb-3 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
              {t("orders_modal_update_status")}
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_ACTIONS.filter((a) => a.status !== order.status).map((a) => (
                <Button
                  key={a.status}
                  size="sm"
                  variant="secondary"
                  loading={updatingStatus === a.status}
                  disabled={updatingStatus !== null}
                  onClick={() => handleStatusChange(a.status)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </section>

          {order.status === "PENDING" && (
            <Button
              type="button"
              size="lg"
              block
              loading={resending}
              onClick={handleResendSMS}
            >
              <RefreshCcw size={16} aria-hidden />
              {t("orders_resend_sms")}
            </Button>
          )}

          <section>
            <p className="mb-3 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
              {t("orders_sms_logs")}
            </p>
            {order.smsLogs.length === 0 ? (
              <p className="text-[13px] text-[var(--color-fg-faint)]">
                {t("orders_empty_sms_logs")}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {order.smsLogs.map((log) => {
                  const sent = log.status === "SENT";
                  return (
                    <li
                      key={log.id}
                      className={cn(
                        "rounded-[var(--radius-md)] border p-3",
                        sent
                          ? "border-[var(--color-success)]/20 bg-[var(--color-success)]/[0.06]"
                          : "border-[var(--color-danger)]/20 bg-[var(--color-danger)]/[0.06]"
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.06em]">
                        <span
                          className={cn(
                            "font-medium",
                            sent
                              ? "text-[var(--color-success)]"
                              : "text-[var(--color-danger)]"
                          )}
                        >
                          {sent ? t("orders_sms_status_sent") : t("orders_sms_status_failed")}
                        </span>
                        <span className="text-[var(--color-fg-faint)]">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      {sent && (
                        <p className="text-[12px] leading-snug text-[var(--color-fg-muted)]">
                          {log.message}
                        </p>
                      )}
                      {log.errorMessage && (
                        <p className="text-[12px] text-[var(--color-danger)]">
                          {log.errorMessage}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const FILTERS = [
    { key: "all", label: t("orders_all"), status: null },
    { key: "pending", label: t("orders_pending"), status: "PENDING" },
    { key: "confirmed", label: t("orders_confirmed"), status: "CONFIRMED" },
    { key: "cancelled", label: t("orders_cancelled"), status: "CANCELLED" },
  ];

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [filterKey, setFilterKey] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [prepaidLoading, setPrepaidLoading] = useState<Record<number, boolean>>({});
  const [prepaidUrls, setPrepaidUrls] = useState<Record<number, string>>({});

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t("orders_status_pending"),
    CONFIRMED: t("orders_status_confirmed"),
    PREPARING: t("orders_status_preparing"),
    SHIPPED: t("orders_status_shipped"),
    DELIVERED: t("orders_status_delivered"),
    CANCELLED: t("orders_status_cancelled"),
  };

  const fetchOrders = useCallback(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const activeFilter = FILTERS.find((f) => f.key === filterKey);
    const status = activeFilter?.status ?? null;
    const url = `${API}/orders${status ? `?status=${status}` : ""}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function openDetail(orderId: number) {
    setLoadingDetail(orderId);
    try {
      const res = await fetch(`${API}/orders/${orderId}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      setSelectedOrder(data.order);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setLoadingDetail(null);
    }
  }

  async function getPrepaidLink(orderId: number) {
    setPrepaidLoading((prev) => ({ ...prev, [orderId]: true }));
    const token = getToken();
    const res = await fetch(`${API}/orders/${orderId}/prepaid-link`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.prepaidUrl) {
      setPrepaidUrls((prev) => ({ ...prev, [orderId]: data.prepaidUrl }));
    }
    setPrepaidLoading((prev) => ({ ...prev, [orderId]: false }));
  }

  function handleOrderUpdate(updated: OrderDetail) {
    setSelectedOrder(updated);
    setOrders((prev) =>
      prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o))
    );
  }

  const q = search.toLowerCase().trim();
  const filtered = q
    ? orders.filter(
        (o) =>
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q)
      )
    : orders;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1
            className="text-[var(--color-fg)]"
            style={{ fontSize: 28, fontWeight: 500, letterSpacing: "var(--tracking-display)", margin: 0 }}
          >
            {t("orders_title")}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">
            {t("orders_subtitle")} · <span className="tabular-nums">{total}</span>
          </p>
        </div>
      </header>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-fg-faint)]"
          />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("orders_search")}
            className="pl-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label={t("common_clear")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const active = filterKey === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterKey(f.key)}
              className={cn(
                "h-9 whitespace-nowrap rounded-[var(--radius-md)] border px-3 text-[13px] font-medium transition-colors",
                active
                  ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--color-fg-faint)]">{t("dash_loading")}</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={Inbox} title={t("orders_empty")} />
        </Card>
      ) : isMobile ? (
        <div className="flex flex-col gap-2.5">
          {filtered.map((order) => {
            const isLoadingThis = loadingDetail === order.id;
            return (
              <Card
                key={order.id}
                onClick={() => !isLoadingThis && openDetail(order.id)}
                className={cn(
                  "cursor-pointer p-4",
                  isLoadingThis && "cursor-not-allowed opacity-60"
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-[var(--color-fg)]">
                      {order.customerName}
                    </p>
                    <p className="text-[12px] text-[var(--color-fg-muted)]">#{order.id}</p>
                  </div>
                  <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>
                    {STATUS_LABELS[order.status] || order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--color-fg-muted)] tabular-nums">
                    {order.customerPhone}
                  </span>
                  <span className="font-medium text-[var(--color-fg)] tabular-nums">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[var(--color-fg-faint)] tabular-nums">
                  {formatDate(order.createdAt)}
                </p>
                {order.status === "PENDING" && (
                  <div className="mt-2">
                    {prepaidUrls[order.id] ? (
                      <p className="break-all rounded-[var(--radius-sm)] bg-[var(--color-accent-faded)] px-2 py-1 text-[11px] text-[var(--color-accent)]">
                        {prepaidUrls[order.id]}
                      </p>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        loading={prepaidLoading[order.id]}
                        onClick={(e) => {
                          e.stopPropagation();
                          getPrepaidLink(order.id);
                        }}
                      >
                        <CreditCard size={14} aria-hidden />
                        {t("orders_prepaid_link")}
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>#</TH>
                <TH>{t("orders_col_customer")}</TH>
                <TH>{t("orders_col_phone")}</TH>
                <TH className="text-right">{t("orders_col_total")}</TH>
                <TH>{t("orders_col_status")}</TH>
                <TH>{t("orders_col_date")}</TH>
                <TH className="text-right">{t("orders_col_action")}</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((order) => {
                const isLoadingThis = loadingDetail === order.id;
                return (
                  <TR key={order.id}>
                    <TD className="text-[var(--color-fg-muted)] tabular-nums">#{order.id}</TD>
                    <TD className="font-medium">{order.customerName}</TD>
                    <TD className="text-[var(--color-fg-muted)] tabular-nums">
                      {order.customerPhone}
                    </TD>
                    <TD className="text-right tabular-nums font-medium">
                      {formatCurrency(order.total)}
                    </TD>
                    <TD>
                      <Badge tone={STATUS_TONE[order.status] ?? "neutral"}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </TD>
                    <TD className="text-[var(--color-fg-muted)] tabular-nums">
                      {formatDate(order.createdAt)}
                    </TD>
                    <TD className="text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={isLoadingThis}
                          onClick={() => openDetail(order.id)}
                        >
                          {t("orders_detail_button")}
                        </Button>
                        {order.status === "PENDING" &&
                          (prepaidUrls[order.id] ? (
                            <span className="max-w-[180px] break-all rounded-[var(--radius-sm)] bg-[var(--color-accent-faded)] px-2 py-1 text-[11px] text-[var(--color-accent)]">
                              {prepaidUrls[order.id]}
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={prepaidLoading[order.id]}
                              onClick={() => getPrepaidLink(order.id)}
                            >
                              <CreditCard size={14} aria-hidden />
                              {t("orders_prepaid")}
                            </Button>
                          ))}
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <OrderModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdate={handleOrderUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
