"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Star, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
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
  labelKey: 'landing_pricing_free_label' | null;
  rawLabel: string | null;
}

const PLANS: Record<PlanType, PlanConfig> = {
  FREE: {
    price: 0,
    yearlyPrice: 0,
    shops: 1,
    smsCreditsMonthly: 50,
    features: ["basic_sms"],
    labelKey: "landing_pricing_free_label",
    rawLabel: null,
  },
  STARTER: {
    price: 99,
    yearlyPrice: 79,
    shops: 3,
    smsCreditsMonthly: 300,
    features: ["basic_sms", "otp", "pdf_invoice", "rate_limit_blocking"],
    labelKey: null,
    rawLabel: "Starter",
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
    labelKey: null,
    rawLabel: "Pro",
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
    labelKey: null,
    rawLabel: "Business",
  },
};

const FEATURE_LABEL_KEYS: Record<string, TranslationKey> = {
  basic_sms: "landing_pricing_feature_basic_sms",
  otp: "landing_pricing_feature_otp",
  pdf_invoice: "landing_pricing_feature_pdf_invoice",
  whatsapp: "landing_pricing_feature_whatsapp",
  rto: "landing_pricing_feature_rto",
  blocklist: "landing_pricing_feature_blocklist",
  postal_code: "landing_pricing_feature_postal_code",
  priority_support: "landing_pricing_feature_priority_support",
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
  const { t } = useTranslation();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const planLabel = useMemo(
    () => (key: PlanType): string => {
      const cfg = PLANS[key];
      return cfg.labelKey ? t(cfg.labelKey) : (cfg.rawLabel ?? "");
    },
    [t],
  );

  return (
    <motion.section
      id="pricing"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: easeOut }}
      className="py-24 md:py-32"
      aria-label={t("nav_pricing")}
    >
      <header className="mb-12 text-center">
        <p className="mb-3 text-[12px] uppercase tracking-[0.08em] text-[var(--color-accent)]">
          {t("nav_pricing")}
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
          {t("landing_pricing_heading")}
        </h2>
        <p className="mt-4 text-[16px] text-[var(--color-fg-muted)]">
          {t("landing_pricing_subhead")}
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
                {cycle === "monthly" ? t("landing_pricing_monthly") : t("landing_pricing_yearly")}
                {cycle === "yearly" && <Badge tone="success">{t("pricing_yearly_discount")}</Badge>}
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
                  <Star size={11} aria-hidden /> {t("pricing_most_popular")}
                </span>
              )}

              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-accent)]">
                  {planLabel(planKey)}
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
                    {price === 0 ? t("landing_pricing_free_label") : formatCurrency(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-[13px] text-[var(--color-fg-muted)]">
                      /{billing === "monthly" ? t("landing_pricing_period_month") : t("landing_pricing_period_year")}
                    </span>
                  )}
                </div>
                {billing === "yearly" && price > 0 && (
                  <p className="mt-1 text-[12px] text-[var(--color-fg-faint)]">
                    {t("pricing_normally_label").replace("{price}", formatCurrency(config.price))}
                  </p>
                )}
              </div>

              <div className="mb-4 space-y-1.5 border-b border-[var(--color-border)] pb-4 text-[13px] text-[var(--color-fg-muted)]">
                <p>{config.shops === -1 ? t("pricing_unlimited") : config.shops} {t("pricing_shops_label")}</p>
                <p className="tabular-nums">
                  {config.smsCreditsMonthly.toLocaleString("tr-TR")} {t("pricing_sms_monthly_label")}
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
                      {FEATURE_LABEL_KEYS[feat] ? t(FEATURE_LABEL_KEYS[feat]) : feat}
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
                {planKey === "FREE" ? t("landing_pricing_btn_free") : t("landing_pricing_btn_paid")}
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
