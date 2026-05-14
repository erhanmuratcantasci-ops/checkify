"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CartTable, type RecoverCartRow } from "@/components/recover/CartTable";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getToken() {
  if (typeof window === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

interface StatsWindow {
  total: number;
  recovered: number;
  recoveryRate: number;
  recoveredValue: number;
}

interface Stats {
  window7d: StatsWindow;
  window30d: StatsWindow;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RecoverPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const FILTERS = [
    { key: "all", label: t("recover_filter_all"), status: null },
    { key: "abandoned", label: t("recover_filter_abandoned"), status: "abandoned" },
    { key: "recovering", label: t("recover_filter_recovering"), status: "recovering" },
    { key: "recovered", label: t("recover_filter_recovered"), status: "recovered" },
    { key: "expired", label: t("recover_filter_expired"), status: "expired" },
  ];

  const [carts, setCarts] = useState<RecoverCartRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filterKey, setFilterKey] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchCarts = useCallback(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const activeFilter = FILTERS.find((f) => f.key === filterKey);
    const status = activeFilter?.status ?? null;
    const url = `${API}/abandoned-carts${status ? `?status=${status}` : ""}`;
    fetch(url, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setCarts(data.carts ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, router]);

  useEffect(() => {
    fetchCarts();
    fetch(`${API}/abandoned-carts/stats`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => null);
  }, [fetchCarts]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1
            className="text-[var(--color-fg)]"
            style={{ fontSize: 28, fontWeight: 500, letterSpacing: "var(--tracking-display)", margin: 0 }}
          >
            {t("recover_title")}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">
            {t("recover_subtitle")} · <span className="tabular-nums">{total}</span>
          </p>
        </div>
      </header>

      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <StatCard
            label={t("recover_stats_7d")}
            window={stats.window7d}
            t={t}
          />
          <StatCard
            label={t("recover_stats_30d")}
            window={stats.window30d}
            t={t}
          />
        </div>
      )}

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
          <p className="text-[14px] text-[var(--color-fg-faint)]">{t("recover_loading")}</p>
        </Card>
      ) : carts.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShoppingCart}
            title={t("recover_empty_title")}
            description={t("recover_empty_desc")}
          />
        </Card>
      ) : (
        <CartTable carts={carts} />
      )}
    </div>
  );
}

function StatCard({
  label,
  window: w,
  t,
}: {
  label: string;
  window: StatsWindow;
  t: (k: import("@/lib/i18n").TranslationKey) => string;
}) {
  return (
    <Card className="p-5">
      <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
        {label}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[11px] text-[var(--color-fg-muted)]">{t("recover_stats_rate")}</p>
          <p className="mt-1 text-[20px] font-medium tabular-nums text-[var(--color-fg)]">
            {w.recoveryRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[var(--color-fg-muted)]">{t("recover_stats_recovered")}</p>
          <p className="mt-1 text-[20px] font-medium tabular-nums text-[var(--color-fg)]">
            {w.recovered} / {w.total}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[var(--color-fg-muted)]">{t("recover_stats_value")}</p>
          <p className="mt-1 text-[20px] font-medium tabular-nums text-[var(--color-fg)]">
            {formatCurrency(w.recoveredValue)}
          </p>
        </div>
      </div>
    </Card>
  );
}
