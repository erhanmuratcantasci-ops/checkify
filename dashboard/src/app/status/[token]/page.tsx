"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  Clock,
  Package,
  Truck,
  Home,
  XCircle,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { MerchantBrandedLayout } from "@/components/ui/merchant-branded-layout";
import { OrderSummaryCard } from "@/components/ui/order-summary-card";
import { Badge } from "@/components/ui/badge";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface OrderStatus {
  id: number;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  shopName: string;
}

type TimelineStepKey = "PENDING" | "CONFIRMED" | "PREPARING" | "SHIPPED" | "DELIVERED";

const TIMELINE: { key: TimelineStepKey; labelKey: string; Icon: LucideIcon }[] = [
  { key: "PENDING", labelKey: "cod_status_step_pending", Icon: Clock },
  { key: "CONFIRMED", labelKey: "cod_status_confirmed", Icon: Check },
  { key: "PREPARING", labelKey: "cod_status_step_preparing", Icon: Package },
  { key: "SHIPPED", labelKey: "cod_status_step_shipped", Icon: Truck },
  { key: "DELIVERED", labelKey: "cod_status_step_delivered", Icon: Home },
];

const TIMELINE_INDEX: Record<TimelineStepKey, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
};

const HEADLINE_KEY: Record<string, string> = {
  PENDING: "cod_status_pending",
  CONFIRMED: "cod_status_confirmed",
  PREPARING: "cod_status_preparing",
  SHIPPED: "cod_status_shipped",
  DELIVERED: "cod_status_delivered",
  CANCELLED: "cod_status_cancelled",
};

const HEADLINE_TONE: Record<string, "success" | "warning" | "danger" | "info" | "accent"> = {
  PENDING: "warning",
  CONFIRMED: "success",
  PREPARING: "info",
  SHIPPED: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export default function StatusPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/status/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setOrder(data.order);
      })
      .catch(() => setError(t("cod_status_lookup_failed")))
      .finally(() => setLoading(false));
  }, [token, t]);

  return (
    <MerchantBrandedLayout shopName={order?.shopName}>
      {loading ? (
        <Loading />
      ) : !order ? (
        <NotFound message={error ?? t("cod_status_lookup_failed")} />
      ) : order.status === "CANCELLED" ? (
        <CancelledView order={order} t={t} />
      ) : (
        <ActiveStatusView order={order} t={t} />
      )}
    </MerchantBrandedLayout>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center pt-16">
      <div className="relative h-12 w-12">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-[var(--color-border)]"
        />
        <span
          aria-hidden
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-accent)]"
        />
      </div>
    </div>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center pt-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)]">
        <Search size={36} strokeWidth={1.6} aria-hidden className="text-[var(--color-fg-muted)]" />
      </div>
      <p className="mt-6 text-[15px] text-[var(--color-fg-muted)]">{message}</p>
    </div>
  );
}

function CancelledView({
  order,
  t,
}: {
  order: OrderStatus;
  t: (k: never) => string;
}) {
  const headline = (t as (k: string) => string)(HEADLINE_KEY[order.status]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className="flex flex-col items-center pt-2 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--color-fg-muted)]/20 bg-[var(--color-surface)]">
        <XCircle size={42} strokeWidth={1.6} aria-hidden className="text-[var(--color-fg-muted)]" />
      </div>
      <h1
        className="mt-6 text-[var(--color-fg)]"
        style={{
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: "var(--tracking-display)",
          margin: 0,
        }}
      >
        {headline}
      </h1>
      <OrderSummaryCard
        className="mt-6 w-full text-left"
        shopName={order.shopName}
        customerName={order.customerName}
        orderId={order.id}
        total={order.total}
        createdAt={order.createdAt}
      />
    </motion.div>
  );
}

function ActiveStatusView({
  order,
  t,
}: {
  order: OrderStatus;
  t: (k: never) => string;
}) {
  const tStr = t as (k: string) => string;
  const headline = tStr(HEADLINE_KEY[order.status] ?? "cod_status_confirmed");
  const tone = HEADLINE_TONE[order.status] ?? "neutral";
  const currentIndex = TIMELINE_INDEX[order.status as TimelineStepKey] ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className="flex flex-col"
    >
      <div className="text-center">
        <Badge tone={tone}>{headline}</Badge>
        <h1
          className="mt-3 text-[var(--color-fg)]"
          style={{
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            margin: 0,
          }}
        >
          Sipariş #{order.id}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">{order.customerName}</p>
      </div>

      <ol className="mt-8" aria-label="Sipariş durumu">
        {TIMELINE.map((step, i) => {
          const completed = i < currentIndex;
          const active = i === currentIndex;
          const isLast = i === TIMELINE.length - 1;
          return (
            <li key={step.key} className="relative flex gap-4">
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[15px] top-9 bottom-[-12px] w-px",
                    completed
                      ? "bg-[var(--color-success)]/40"
                      : "bg-[var(--color-border)]"
                  )}
                />
              )}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                  active &&
                    "border-[var(--color-accent)] bg-[var(--color-accent-faded)]",
                  completed &&
                    "border-[var(--color-success)] bg-[var(--color-success)]/[0.16]",
                  !active &&
                    !completed &&
                    "border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
                )}
              >
                <step.Icon
                  size={14}
                  strokeWidth={2}
                  aria-hidden
                  className={cn(
                    active && "text-[var(--color-accent)]",
                    completed && "text-[var(--color-success)]",
                    !active && !completed && "text-[var(--color-fg-faint)]"
                  )}
                />
              </div>
              <div className={cn("flex-1 pb-7", isLast && "pb-0")}>
                <p
                  className={cn(
                    "text-[14px] font-medium",
                    active
                      ? "text-[var(--color-fg)]"
                      : completed
                        ? "text-[var(--color-fg-muted)]"
                        : "text-[var(--color-fg-faint)]"
                  )}
                >
                  {tStr(step.labelKey)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <OrderSummaryCard
        className="mt-2 w-full text-left"
        shopName={order.shopName}
        customerName={order.customerName}
        orderId={order.id}
        total={order.total}
        createdAt={order.createdAt}
      />
    </motion.div>
  );
}
