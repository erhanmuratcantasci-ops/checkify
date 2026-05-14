"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { Shield } from "lucide-react";
import { RiskBadge } from "@/components/fraud/RiskBadge";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Score {
  id: string;
  score: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  action: string | null;
  createdAt: string;
  reviewedAt: string | null;
  order: {
    id: number;
    customerName: string;
    customerPhone: string;
    total: number;
    status: string;
    createdAt: string;
    shop: { id: number; name: string };
  };
}

interface Stats {
  high: number;
  critical: number;
  total: number;
  sinceDays: number;
}

const RISK_FILTERS = ["all", "low", "medium", "high", "critical"] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FraudPage() {
  const { t } = useTranslation();
  const [scores, setScores] = useState<Score[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof RISK_FILTERS)[number]>("all");

  useEffect(() => {
    const token = document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1];
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    setLoading(true);
    const qs = filter === "all" ? "" : `?riskLevel=${filter}`;
    Promise.all([
      fetch(`${API}/fraud/orders${qs}`, { headers }).then((r) => r.json()),
      fetch(`${API}/fraud/stats`, { headers }).then((r) => r.json()),
    ])
      .then(([list, s]) => {
        setScores(list.scores ?? []);
        setStats(s ?? null);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
      <header className="mb-6">
        <h1
          className="text-[var(--color-fg)]"
          style={{ fontSize: 28, fontWeight: 500, letterSpacing: "var(--tracking-display)", margin: 0 }}
        >
          {t("fraud_title")}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">
          {t("fraud_subtitle")}
        </p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label={t("fraud_stats_high_7d")}
          value={loading ? "—" : String(stats?.high ?? 0)}
          deltaTone="warning"
        />
        <MetricCard
          label={t("fraud_stats_critical_7d")}
          value={loading ? "—" : String(stats?.critical ?? 0)}
          deltaTone="danger"
        />
        <MetricCard
          label={t("fraud_stats_total_7d")}
          value={loading ? "—" : String(stats?.total ?? 0)}
        />
      </section>

      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {RISK_FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "h-9 whitespace-nowrap rounded-[var(--radius-md)] border px-3 text-[13px] font-medium transition-colors " +
                (active
                  ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]")
              }
            >
              {t(`fraud_filter_${f}` as never)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--color-fg-faint)]">{t("dash_loading")}</p>
        </Card>
      ) : scores.length === 0 ? (
        <Card>
          <EmptyState icon={Shield} title={t("fraud_empty")} description={t("fraud_empty_desc")} />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <CardHeader className="px-6 pt-5">
            <CardTitle>{t("fraud_list_title")}</CardTitle>
          </CardHeader>
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>#</TH>
                <TH>{t("orders_col_customer")}</TH>
                <TH>{t("orders_col_phone")}</TH>
                <TH className="text-right">{t("orders_col_total")}</TH>
                <TH>{t("fraud_col_score")}</TH>
                <TH>{t("fraud_col_risk")}</TH>
                <TH>{t("orders_col_date")}</TH>
                <TH className="text-right">{t("fraud_col_action")}</TH>
              </TR>
            </THead>
            <TBody>
              {scores.map((s) => (
                <TR key={s.id}>
                  <TD className="text-[var(--color-fg-muted)] tabular-nums">#{s.order.id}</TD>
                  <TD className="font-medium">{s.order.customerName}</TD>
                  <TD className="text-[var(--color-fg-muted)] tabular-nums">{s.order.customerPhone}</TD>
                  <TD className="text-right tabular-nums font-medium">{formatCurrency(s.order.total)}</TD>
                  <TD className="tabular-nums">{s.score.toFixed(2)}</TD>
                  <TD>
                    <RiskBadge level={s.riskLevel} />
                  </TD>
                  <TD className="text-[var(--color-fg-muted)] tabular-nums">
                    {new Date(s.order.createdAt).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </TD>
                  <TD className="text-right">
                    <Link
                      href={`/fraud/${s.order.id}`}
                      className="text-[13px] font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                    >
                      {t("fraud_review_btn")} →
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
