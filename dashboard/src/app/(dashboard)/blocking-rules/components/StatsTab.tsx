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
import { useTranslation, type TranslationKey } from "@/lib/i18n";
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

const SOURCE_LABEL_KEYS: Record<BlockSource, TranslationKey> = {
  LEGACY_PHONE: "blocking_stats_source_legacy_phone_short",
  LEGACY_POSTAL_CODE: "blocking_stats_source_legacy_postal_short",
  BLOCKING_RULE: "blocking_stats_source_rule_short",
  RATE_LIMIT: "blocking_stats_source_rate_limit_short",
};

const RULE_TYPE_LABEL_KEYS: Record<BlockingRuleType, TranslationKey> = {
  IP_ADDRESS: "blocking_stats_ruletype_ip_address_short",
  IP_RANGE: "blocking_stats_ruletype_ip_range_short",
  PHONE_PATTERN: "blocking_stats_ruletype_phone_pattern_short",
  EMAIL_DOMAIN: "blocking_stats_ruletype_email_domain_short",
  CUSTOMER_NAME: "blocking_stats_ruletype_customer_name_short",
  MAX_ORDERS_PER_PHONE: "blocking_stats_ruletype_max_per_phone_short",
  MAX_ORDERS_PER_IP: "blocking_stats_ruletype_max_per_ip_short",
};

function fmtDayLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function StatsTab({ shopId }: { shopId: number }) {
  const { t } = useTranslation();
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
      setError(err instanceof Error ? err.message : t("blocking_stats_load_error"));
    }
    setLoading(false);
  }, [shopId, days, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <p className="text-[14px] text-[var(--color-fg-faint)]">{t("loading")}</p>
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

  const pieData = (Object.keys(SOURCE_LABEL_KEYS) as BlockSource[])
    .map((src) => ({ source: src, name: t(SOURCE_LABEL_KEYS[src]), value: stats.bySource[src] ?? 0 }))
    .filter((d) => d.value > 0);

  const barData = stats.topRules.map((r) => ({
    name: t(RULE_TYPE_LABEL_KEYS[r.ruleType]) ?? r.ruleType,
    value: r.matchCount,
    label: r.value.length > 20 ? r.value.slice(0, 18) + "…" : r.value,
  }));

  return (
    <>
      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          label={t("blocking_stats_total_blocked")}
          value={totalBlocked.toLocaleString("tr-TR")}
          hint={t("blocking_stats_days_filter").replace("{days}", String(days))}
        />
        <MetricCard
          label={t("blocking_stats_sms_savings")}
          value={`~${estimatedSavings.toFixed(2)} ₺`}
          deltaTone="success"
          hint={`${totalBlocked} × 0,25 ₺`}
        />
        <MetricCard
          label={t("blocking_stats_top_rule")}
          value={topRule ? t(RULE_TYPE_LABEL_KEYS[topRule.ruleType]) ?? topRule.ruleType : "—"}
          hint={
            topRule
              ? `${t("blocking_rule_matches").replace("{n}", String(topRule.matchCount))} · ${
                  topRule.value.length > 24 ? topRule.value.slice(0, 22) + "…" : topRule.value
                }`
              : t("blocking_stats_no_data_hint")
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
              {t("blocking_stats_days_filter").replace("{days}", String(d))}
            </button>
          );
        })}
      </div>

      {totalBlocked === 0 ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title={t("blocking_stats_empty_title")}
            description={t("blocking_stats_empty_desc")}
          />
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{t("blocking_stats_daily_trend")}</CardTitle>
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
                    formatter={(v) => [v, t("blocking_stats_blocked_label")]}
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
                <CardTitle>{t("blocking_stats_source_distribution")}</CardTitle>
              </CardHeader>
              {pieData.length === 0 ? (
                <p className="text-[13px] text-[var(--color-fg-faint)]">{t("blocking_stats_no_data")}</p>
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
                <CardTitle>{t("blocking_stats_top_rules_title")}</CardTitle>
              </CardHeader>
              {barData.length === 0 ? (
                <p className="text-[13px] text-[var(--color-fg-faint)]">
                  {t("blocking_stats_no_rules")}
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
                            : t("blocking_stats_tooltip_match"),
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
