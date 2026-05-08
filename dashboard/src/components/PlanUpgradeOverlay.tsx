"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { easeOut } from "@/lib/motion";

interface PlanCard {
  label: string;
  price: string;
  features: string[];
  emphasis?: boolean;
}

const UPGRADE_PLANS: Record<string, PlanCard> = {
  STARTER: {
    label: "Starter",
    price: "99 ₺/ay",
    features: ["300 SMS/ay", "3 mağaza", "OTP doğrulama", "PDF fatura"],
  },
  PRO: {
    label: "Pro",
    price: "249 ₺/ay",
    features: [
      "1.000 SMS/ay",
      "10 mağaza",
      "WhatsApp",
      "RTO analizi",
      "Engel listesi",
    ],
    emphasis: true,
  },
  BUSINESS: {
    label: "Business",
    price: "499 ₺/ay",
    features: [
      "3.000 SMS/ay",
      "Sınırsız mağaza",
      "Tüm özellikler",
      "Öncelikli destek",
    ],
  },
};

interface Props {
  featureName?: string;
  requiredPlan?: "STARTER" | "PRO" | "BUSINESS";
}

export default function PlanUpgradeOverlay({ featureName, requiredPlan }: Props) {
  const router = useRouter();

  const planOrder = ["STARTER", "PRO", "BUSINESS"];
  const startIdx = requiredPlan ? planOrder.indexOf(requiredPlan) : 0;
  const visiblePlans = planOrder.slice(startIdx);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--color-bg)]/95 px-4 py-8 backdrop-blur-2xl"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="w-full max-w-2xl text-center"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-faded)]">
          <Lock size={26} aria-hidden className="text-[var(--color-accent)]" />
        </div>

        <h2
          className="text-[var(--color-fg)]"
          style={{
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            margin: 0,
          }}
        >
          Bu özellik planında mevcut değil
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-[var(--color-fg-muted)]">
          {featureName ? (
            <>
              <strong className="text-[var(--color-fg)]">{featureName}</strong> özelliğini
              kullanmak için planını yükselt.
            </>
          ) : (
            "Bu özelliği kullanmak için planını yükselt."
          )}
        </p>

        <div
          className="mt-7 grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${visiblePlans.length}, minmax(0, 1fr))`,
          }}
        >
          {visiblePlans.map((key) => {
            const plan = UPGRADE_PLANS[key];
            const emphasis = plan.emphasis;
            return (
              <div
                key={key}
                className={
                  "flex flex-col rounded-[var(--radius-lg)] border p-5 text-left " +
                  (emphasis
                    ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-elevated)]")
                }
              >
                <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                  {plan.label}
                </p>
                <p
                  className="mt-1 text-[var(--color-fg)]"
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: "var(--tracking-heading)",
                  }}
                >
                  {plan.price}
                </p>
                <ul className="mt-3 space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)]"
                    >
                      <Check
                        size={12}
                        aria-hidden
                        className="shrink-0 text-[var(--color-accent)]"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-7 flex flex-col items-center gap-3">
          <Button size="lg" onClick={() => router.push("/pricing")}>
            Planı yükselt
            <ArrowRight size={16} aria-hidden />
          </Button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-[13px] text-[var(--color-fg-muted)] underline underline-offset-4 transition-colors hover:text-[var(--color-fg)]"
          >
            Şimdilik kapat
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
