"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/Toast";
import { RiskBadge } from "@/components/fraud/RiskBadge";
import { SignalBreakdown } from "@/components/fraud/SignalBreakdown";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Signal {
  key: string;
  weight: number;
  triggered: boolean;
  detail?: Record<string, unknown>;
}

interface FraudDetail {
  id: string;
  score: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  action: string | null;
  signals: Signal[];
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  order: {
    id: number;
    customerName: string;
    customerPhone: string;
    total: number;
    status: string;
    createdAt: string;
    ipAddress: string | null;
    shop: { id: number; name: string };
  };
}

export default function FraudDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [score, setScore] = useState<FraudDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<"approve" | "cancel" | null>(null);

  useEffect(() => {
    const token = document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1];
    if (!token) return;
    fetch(`${API}/fraud/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setScore(d.score ?? null))
      .finally(() => setLoading(false));
  }, [orderId]);

  async function handleReview(action: "approve" | "cancel") {
    setReviewing(action);
    try {
      const token = document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1];
      const res = await fetch(`${API}/fraud/orders/${orderId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(t("error_occurred"));
      showToast(action === "approve" ? t("fraud_toast_approved") : t("fraud_toast_cancelled"), "success");
      router.push("/fraud");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setReviewing(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
        <p className="text-[14px] text-[var(--color-fg-faint)]">{t("dash_loading")}</p>
      </div>
    );
  }
  if (!score) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
        <p className="text-[14px] text-[var(--color-fg-muted)]">{t("fraud_not_found")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
      <Link
        href="/fraud"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft size={14} aria-hidden /> {t("fraud_back_to_list")}
      </Link>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-[var(--color-fg)]"
            style={{ fontSize: 26, fontWeight: 500, letterSpacing: "var(--tracking-display)", margin: 0 }}
          >
            {t("fraud_detail_title")} #{score.order.id}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">
            {score.order.customerName} · {score.order.customerPhone}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[var(--color-fg-muted)]">{t("fraud_col_score")}:</span>
          <span className="text-[22px] font-medium text-[var(--color-fg)] tabular-nums">
            {score.score.toFixed(2)}
          </span>
          <RiskBadge level={score.riskLevel} />
        </div>
      </header>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t("fraud_signal_breakdown")}</CardTitle>
        </CardHeader>
        <SignalBreakdown signals={score.signals} />
      </Card>

      {score.reviewedAt ? (
        <Card>
          <p className="text-[13px] text-[var(--color-fg-muted)]">
            {t("fraud_already_reviewed")}: <strong className="text-[var(--color-fg)]">{score.action}</strong> ·{" "}
            {new Date(score.reviewedAt).toLocaleString("tr-TR")}
          </p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("fraud_manual_review")}</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            <Button
              size="md"
              variant="primary"
              loading={reviewing === "approve"}
              disabled={reviewing !== null}
              onClick={() => handleReview("approve")}
            >
              {t("fraud_action_approve")}
            </Button>
            <Button
              size="md"
              variant="secondary"
              loading={reviewing === "cancel"}
              disabled={reviewing !== null}
              onClick={() => handleReview("cancel")}
            >
              {t("fraud_action_cancel")}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
