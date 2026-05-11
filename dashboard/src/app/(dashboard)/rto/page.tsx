"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { TrendingDown } from "lucide-react";
import PlanUpgradeOverlay from "@/components/PlanUpgradeOverlay";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/lib/i18n";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), {
  ssr: false,
});
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});

interface RTOData {
  rtoRate: number;
  cancelled: number;
  total: number;
  trend: { date: string; count: number }[];
  topPhones: { phone: string; count: number }[];
}

function formatDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function RTOPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<RTOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [planAllowed, setPlanAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1];
    if (!token) {
      router.push("/login");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API}/plans/current`, { headers })
      .then((r) => r.json())
      .then((planData) => {
        const allowed = ["PRO", "BUSINESS"].includes(planData.plan ?? "");
        setPlanAllowed(allowed);
        if (allowed) {
          return fetch(`${API}/orders/stats/rto`, { headers }).then((r) => r.json());
        }
        return null;
      })
      .then((rtoData) => {
        if (rtoData) setData(rtoData);
      })
      .catch((err) => {
        if (err?.status === 401 || String(err).includes("401")) router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const trendWithLabel = data?.trend.map((d) => ({ ...d, date: formatDay(d.date) })) ?? [];
  const high = (data?.rtoRate ?? 0) > 20;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
      <header className="mb-8">
        <h1
          className="text-[var(--color-fg)]"
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            margin: 0,
          }}
        >
          {t("rto_title")}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">
          {t("rto_subtitle")}
        </p>
      </header>

      {planAllowed === false && (
        <PlanUpgradeOverlay featureName={t("rto_title")} requiredPlan="PRO" />
      )}

      {planAllowed === true && (
        <>
          <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard
              label={t("rto_rate_label")}
              value={loading ? "—" : `%${data?.rtoRate ?? 0}`}
              deltaTone={high ? "danger" : "neutral"}
              delta={high ? t("rto_high_status") : undefined}
            />
            <MetricCard
              label={t("rto_cancelled_label")}
              value={loading ? "—" : (data?.cancelled ?? 0).toLocaleString("tr-TR")}
            />
            <MetricCard
              label={t("rto_total_orders_label")}
              value={loading ? "—" : (data?.total ?? 0).toLocaleString("tr-TR")}
            />
          </section>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{t("rto_trend_title")}</CardTitle>
            </CardHeader>
            {loading || !data ? (
              <p className="text-[13px] text-[var(--color-fg-faint)]">{t("loading")}</p>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendWithLabel}
                    margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
                  >
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#52525b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#52525b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      // Recharts inline styles need literal colors; CSS vars
                      // (var(--color-bg-overlay)) sometimes fail to resolve at
                      // runtime under Tailwind v4 + Turbopack, so mirror the
                      // token values inline. Keep in sync with @theme.
                      contentStyle={{
                        background: "#141416",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: 10,
                        color: "#f5f5f7",
                        fontSize: 13,
                      }}
                      formatter={(v) => [v, t("orders_cancelled")]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#FB7185"
                      strokeWidth={2}
                      dot={{ fill: "#FB7185", strokeWidth: 0, r: 3 }}
                      activeDot={{ fill: "#FDA4AF", r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("rto_top_phones_title")}</CardTitle>
            </CardHeader>
            {loading ? (
              <p className="text-[13px] text-[var(--color-fg-faint)]">{t("loading")}</p>
            ) : !data?.topPhones.length ? (
              <EmptyState icon={TrendingDown} title={t("rto_no_data_title")} />
            ) : (
              <ul className="flex flex-col gap-2">
                {data.topPhones.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                  >
                    <span className="font-mono text-[14px] text-[var(--color-fg)] tabular-nums">
                      {p.phone}
                    </span>
                    <Badge tone="danger">{t("rto_cancellations_badge").replace("{n}", String(p.count))}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
