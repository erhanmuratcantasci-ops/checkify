"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Star, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Marketing-side mirror of (dashboard)/pricing — same plan data, same visual
 * vocabulary, but unauthenticated and with the CTA pointing at /register
 * instead of POSTing /plans/upgrade. The plan constants are kept in sync
 * with backend `src/lib/plans.ts`; if backend pricing shifts, update both.
 */

type PlanType = "FREE" | "STARTER" | "PRO" | "BUSINESS";

interface PlanConfig {
  price: number;
  yearlyPrice: number;
  shops: number;
  smsCreditsMonthly: number;
  features: string[];
  label: string;
}

const PLANS: Record<PlanType, PlanConfig> = {
  FREE: {
    price: 0,
    yearlyPrice: 0,
    shops: 1,
    smsCreditsMonthly: 50,
    features: ["basic_sms"],
    label: "Ücretsiz",
  },
  STARTER: {
    price: 99,
    yearlyPrice: 79,
    shops: 3,
    smsCreditsMonthly: 300,
    features: ["basic_sms", "otp", "pdf_invoice", "rate_limit_blocking"],
    label: "Starter",
  },
  PRO: {
    price: 249,
    yearlyPrice: 199,
    shops: 10,
    smsCreditsMonthly: 1000,
    features: [
      "basic_sms",
      "otp",
      "pdf_invoice",
      "whatsapp",
      "rto",
      "blocklist",
      "postal_code",
      "rate_limit_blocking",
      "advanced_blocking",
    ],
    label: "Pro",
  },
  BUSINESS: {
    price: 499,
    yearlyPrice: 399,
    shops: -1,
    smsCreditsMonthly: 3000,
    features: [
      "basic_sms",
      "otp",
      "pdf_invoice",
      "whatsapp",
      "rto",
      "blocklist",
      "postal_code",
      "rate_limit_blocking",
      "advanced_blocking",
      "priority_support",
    ],
    label: "Business",
  },
};

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

const FEATURE_ORDER = [
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

export function MarketingPricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <motion.section
      id="pricing"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: easeOut }}
      className="py-24 md:py-32"
      aria-label="Fiyatlandırma"
    >
      <header className="mb-12 text-center">
        <p className="mb-3 text-[12px] uppercase tracking-[0.08em] text-[var(--color-accent)]">
          Fiyatlandırma
        </p>
        <h2
          className="mx-auto max-w-[680px] text-[var(--color-fg)]"
          style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          İşine uygun planı seç.
        </h2>
        <p className="mt-4 text-[16px] text-[var(--color-fg-muted)]">
          14 gün ücretsiz dene. Kredi kartı gerekmez.
        </p>

        <div className="mt-7 inline-flex gap-1 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((planKey) => {
          const config = PLANS[planKey];
          const isPro = planKey === "PRO";
          const price = billing === "yearly" ? config.yearlyPrice : config.price;

          return (
            <div
              key={planKey}
              className={cn(
                "relative flex flex-col rounded-[var(--radius-lg)] border bg-[var(--color-bg-elevated)] p-6",
                isPro
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
                <p>{config.shops === -1 ? "Sınırsız" : config.shops} mağaza</p>
                <p className="tabular-nums">
                  {config.smsCreditsMonthly.toLocaleString("tr-TR")} SMS/ay
                </p>
              </div>

              <ul className="mb-6 flex flex-1 flex-col gap-2">
                {FEATURE_ORDER.map((feat) => {
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

              <Link
                href="/register"
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-4 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)]",
                  isPro
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
                    : "border border-[var(--color-border-strong)] text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)]"
                )}
              >
                {planKey === "FREE" ? "Hemen başla" : "Bu plana başla"}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
