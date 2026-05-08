"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import {
  blockingStats,
  BlockingStatsResponse,
  BlockingRuleType,
  BlockSource,
} from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const SMS_COST = 0.25;

// Recharts inline-style colors must be literals; CSS vars sometimes fail to
// resolve at runtime under Tailwind v4 + Turbopack. Mirror the @theme tokens.
const ACCENT = "#FB7185";
const ACCENT_SOFT = "#FDA4AF";
const FG_FAINT = "#52525b";
const BORDER_LINE = "rgba(255,255,255,0.05)";

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "#141416",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 10,
  color: "#f5f5f7",
  fontSize: 12,
  padding: "8px 12px",
};

const SOURCE_COLORS: Record<BlockSource, string> = {
  LEGACY_PHONE: "#a1a1aa",
  LEGACY_POSTAL_CODE: "#71717a",
  BLOCKING_RULE: ACCENT,
  RATE_LIMIT: "#FBBF24",
};

const SOURCE_LABELS: Record<BlockSource, string> = {
  LEGACY_PHONE: "Telefon (eski)",
  LEGACY_POSTAL_CODE: "Posta kodu (eski)",
  BLOCKING_RULE: "Kural",
  RATE_LIMIT: "Limit aşımı",
};

const RULE_TYPE_LABELS: Record<BlockingRuleType, string> = {
  IP_ADDRESS: "IP adresi",
  IP_RANGE: "IP aralığı",
  PHONE_PATTERN: "Telefon deseni",
  EMAIL_DOMAIN: "Email alan adı",
  CUSTOMER_NAME: "Müşteri adı",
  MAX_ORDERS_PER_PHONE: "Telefon limiti",
  MAX_ORDERS_PER_IP: "IP limiti",
};

function fmtDayLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function StatsTab({ shopId }: { shopId: number }) {
  const [stats, setStats] = useState<BlockingStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await blockingStats.get(shopId, days);
      setStats(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İstatistikler yüklenemedi");
    }
    setLoading(false);
  }, [shopId, days]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <p className="text-[14px] text-[var(--color-fg-faint)]">Yükleniyor…</p>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <p className="text-[14px] text-[var(--color-danger)]">{error}</p>
      </Card>
    );
  }
  if (!stats) return null;

  const totalBlocked = stats.totalBlocked;
  const estimatedSavings = totalBlocked * SMS_COST;
  const topRule = stats.topRules[0];

  const pieData = (Object.keys(SOURCE_LABELS) as BlockSource[])
    .map((src) => ({ source: src, name: SOURCE_LABELS[src], value: stats.bySource[src] ?? 0 }))
    .filter((d) => d.value > 0);

  const barData = stats.topRules.map((r) => ({
    name: RULE_TYPE_LABELS[r.ruleType] ?? r.ruleType,
    value: r.matchCount,
    label: r.value.length > 20 ? r.value.slice(0, 18) + "…" : r.value,
  }));

  return (
    <>
      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label="Toplam bloklanan"
          value={totalBlocked.toLocaleString("tr-TR")}
          hint={`Son ${days} gün`}
        />
        <MetricCard
          label="Tahmini SMS tasarrufu"
          value={`~${estimatedSavings.toFixed(2)} ₺`}
          deltaTone="success"
          hint={`${totalBlocked} × 0,25 ₺`}
        />
        <MetricCard
          label="En sık tetiklenen"
          value={topRule ? RULE_TYPE_LABELS[topRule.ruleType] ?? topRule.ruleType : "—"}
          hint={
            topRule
              ? `${topRule.matchCount} eşleşme · ${
                  topRule.value.length > 24 ? topRule.value.slice(0, 22) + "…" : topRule.value
                }`
              : "Henüz veri yok"
          }
        />
      </section>

      <div className="mb-5 inline-flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1">
        {([7, 30, 90] as const).map((d) => {
          const active = days === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={cn(
                "h-8 rounded-[calc(var(--radius-md)-2px)] px-3 text-[13px] font-medium transition-colors",
                active
                  ? "bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                  : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
              )}
            >
              Son {d} gün
            </button>
          );
        })}
      </div>

      {totalBlocked === 0 ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="Henüz bloklama verisi yok"
            description="İlk bloklanan sipariş geldiğinde istatistikler burada görünecek."
          />
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Günlük trend</CardTitle>
            </CardHeader>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.byDay} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke={BORDER_LINE} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDayLabel}
                    stroke={FG_FAINT}
                    fontSize={11}
                    tickMargin={8}
                  />
                  <YAxis allowDecimals={false} stroke={FG_FAINT} fontSize={11} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(v) => fmtDayLabel(String(v))}
                    formatter={(v) => [v, "Bloklanan"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={ACCENT}
                    strokeWidth={2}
                    dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: ACCENT_SOFT, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kaynak dağılımı</CardTitle>
              </CardHeader>
              {pieData.length === 0 ? (
                <p className="text-[13px] text-[var(--color-fg-faint)]">Veri yok</p>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.source}
                            fill={SOURCE_COLORS[entry.source]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>En çok tetiklenen 5 kural</CardTitle>
              </CardHeader>
              {barData.length === 0 ? (
                <p className="text-[13px] text-[var(--color-fg-faint)]">
                  Henüz kural eşleşmesi yok
                </p>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke={BORDER_LINE}
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        stroke={FG_FAINT}
                        fontSize={11}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        stroke={FG_FAINT}
                        fontSize={11}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v, _name, p) => [
                          v,
                          p && p.payload && typeof p.payload === "object" && "name" in p.payload
                            ? String(p.payload["name"])
                            : "Eşleşme",
                        ]}
                      />
                      <Bar dataKey="value" fill={ACCENT} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
