"use client";

import { useTranslation } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

type RiskLevel = "low" | "medium" | "high" | "critical";

const TONE: Record<RiskLevel, "success" | "warning" | "danger" | "neutral"> = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { t } = useTranslation();
  const label = t(`fraud_risk_${level}` as never);
  return <Badge tone={TONE[level]}>{label}</Badge>;
}
