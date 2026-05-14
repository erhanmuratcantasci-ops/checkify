"use client";

import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

export interface UpsellStatsData {
  shown: number;
  accepted: number;
  declined: number;
  converted: number;
  totalRevenue: number;
  conversionRate: number;
}

export interface UpsellStatsProps {
  stats: UpsellStatsData;
}

export function UpsellStats({ stats }: UpsellStatsProps) {
  const { t } = useTranslation();
  const cells: Array<{ label: string; value: string }> = [
    { label: t("upsells_stats_shown"), value: stats.shown.toLocaleString("tr-TR") },
    { label: t("upsells_stats_accepted"), value: stats.accepted.toLocaleString("tr-TR") },
    { label: t("upsells_stats_declined"), value: stats.declined.toLocaleString("tr-TR") },
    { label: t("upsells_stats_converted"), value: stats.converted.toLocaleString("tr-TR") },
    {
      label: t("upsells_stats_conversion"),
      value: `${(stats.conversionRate * 100).toFixed(1)}%`,
    },
    {
      label: t("upsells_stats_revenue"),
      value: `${stats.totalRevenue.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺`,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cells.map((c) => (
        <Card key={c.label}>
          <div className="text-[12px] text-[var(--color-fg-muted)]">{c.label}</div>
          <div className="mt-1 text-[20px] font-medium tracking-[var(--tracking-heading)] text-[var(--color-fg)]">
            {c.value}
          </div>
        </Card>
      ))}
    </div>
  );
}
