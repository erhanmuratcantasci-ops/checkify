"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Star } from "lucide-react";
import { useToast } from "@/components/Toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type PlanType = "FREE" | "STARTER" | "PRO" | "BUSINESS";

interface PlanConfig {
  price: number;
  yearlyPrice: number;
  shops: number;
  smsCreditsMonthly: number;
  features: string[];
  label: string;
}

const PLAN_FEATURES: Record<string, string> = {
  basic_sms: "SMS doğrulama",
  otp: "OTP kodu doğrulama",
  pdf_invoice: "PDF fatura",
  whatsapp: "WhatsApp bildirimi",
  rto: "RTO analizi",
  blocklist: "Telefon kara listesi",
  postal_code: "Posta kodu engeli",
  priority_support: "Öncelikli destek",
};

const ALL_FEATURES = [
  "basic_sms",
  "otp",
  "pdf_invoice",
  "whatsapp",
  "rto",
  "blocklist",
  "postal_code",
  "priority_support",
];

const PLAN_ORDER: PlanType[] = ["FREE", "STARTER", "PRO", "BUSINESS"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PricingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [plans, setPlans] = useState<Record<PlanType, PlanConfig> | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanType>("FREE");
  const [upgrading, setUpgrading] = useState<PlanType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1];
    if (!token) {
      router.push("/login");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/plans`, { headers }).then((r) => r.json()),
      fetch(`${API}/plans/current`, { headers }).then((r) => r.json()),
    ])
      .then(([plansData, currentData]) => {
        setPlans(plansData.plans);
        setCurrentPlan(currentData.plan ?? "FREE");
        setBilling(currentData.billingCycle ?? "monthly");
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleUpgrade(plan: PlanType) {
    if (plan === currentPlan) return;
    setUpgrading(plan);
    const token = document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1];
    try {
      const res = await fetch(`${API}/plans/upgrade`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingCycle: billing }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPlan(plan);
        showToast(data.message ?? "Plan güncellendi", "success");
      } else {
        showToast(data.error ?? "Plan güncellenemedi", "error");
      }
    } catch {
      showToast("Bağlantı hatası", "error");
    } finally {
      setUpgrading(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-8 md:px-10 md:py-12">
      <header className="mb-8 text-center">
        <h1
          className="text-[var(--color-fg)]"
          style={{
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            margin: 0,
          }}
        >
          Planlar ve fiyatlandırma
        </h1>
        <p className="mt-2 text-[15px] text-[var(--color-fg-muted)]">
          İşletmene uygun planı seç.
        </p>

        <div className="mt-6 inline-flex gap-1 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1">
          {(["monthly", "yearly"] as const).map((cycle) => {
            const active = billing === cycle;
            return (
              <button
                key={cycle}
                type="button"
                onClick={() => setBilling(cycle)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-[var(--radius-full)] px-4 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                    : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                )}
              >
                {cycle === "monthly" ? "Aylık" : "Yıllık"}
                {cycle === "yearly" && <Badge tone="success">%20 indirim</Badge>}
              </button>
            );
          })}
        </div>
      </header>

      {loading || !plans ? (
        <Card>
          <p className="text-center text-[14px] text-[var(--color-fg-faint)]">Yükleniyor…</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((planKey) => {
            const config = plans[planKey];
            const isCurrent = currentPlan === planKey;
            const isPro = planKey === "PRO";
            const price = billing === "yearly" ? config.yearlyPrice : config.price;

            return (
              <div
                key={planKey}
                className={cn(
                  "relative flex flex-col rounded-[var(--radius-lg)] border bg-[var(--color-bg-elevated)] p-6",
                  isCurrent
                    ? "border-[var(--color-accent)]"
                    : isPro
                      ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)]"
                      : "border-[var(--color-border)]"
                )}
              >
                {isPro && (
                  <span
                    aria-hidden
                    className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-[var(--radius-full)] bg-[var(--color-accent)] px-3 py-1 text-[11px] font-medium text-[var(--color-accent-fg)]"
                  >
                    <Star size={11} aria-hidden /> En popüler
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute right-3 top-3">
                    <Badge tone="accent">Aktif</Badge>
                  </span>
                )}

                <div className="mb-4">
                  <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-accent)]">
                    {config.label}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span
                      className="text-[var(--color-fg)] tabular-nums"
                      style={{
                        fontSize: 32,
                        fontWeight: 500,
                        letterSpacing: "var(--tracking-display)",
                        lineHeight: 1.05,
                      }}
                    >
                      {price === 0 ? "Ücretsiz" : formatCurrency(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-[13px] text-[var(--color-fg-muted)]">
                        /{billing === "monthly" ? "ay" : "yıl"}
                      </span>
                    )}
                  </div>
                  {billing === "yearly" && price > 0 && (
                    <p className="mt-1 text-[12px] text-[var(--color-fg-faint)]">
                      Normalde {formatCurrency(config.price)}/ay
                    </p>
                  )}
                </div>

                <div className="mb-4 space-y-1.5 border-b border-[var(--color-border)] pb-4 text-[13px] text-[var(--color-fg-muted)]">
                  <p>
                    {config.shops === -1 ? "Sınırsız" : config.shops} mağaza
                  </p>
                  <p className="tabular-nums">
                    {config.smsCreditsMonthly.toLocaleString("tr-TR")} SMS/ay
                  </p>
                </div>

                <ul className="mb-6 flex flex-1 flex-col gap-2">
                  {ALL_FEATURES.map((feat) => {
                    const included = config.features.includes(feat);
                    return (
                      <li
                        key={feat}
                        className={cn(
                          "flex items-center gap-2 text-[13px]",
                          included
                            ? "text-[var(--color-fg)]"
                            : "text-[var(--color-fg-faint)]"
                        )}
                      >
                        {included ? (
                          <Check
                            size={14}
                            aria-hidden
                            className="shrink-0 text-[var(--color-success)]"
                          />
                        ) : (
                          <X
                            size={14}
                            aria-hidden
                            className="shrink-0 text-[var(--color-fg-faint)]"
                          />
                        )}
                        {PLAN_FEATURES[feat]}
                      </li>
                    );
                  })}
                </ul>

                <Button
                  block
                  size="md"
                  variant={isCurrent ? "secondary" : isPro ? "primary" : "secondary"}
                  loading={upgrading === planKey}
                  disabled={isCurrent || upgrading !== null}
                  onClick={() => handleUpgrade(planKey)}
                >
                  {upgrading === planKey
                    ? "Geçiliyor…"
                    : isCurrent
                      ? "Mevcut plan"
                      : planKey === "FREE"
                        ? "Düşür"
                        : "Yükselt"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
