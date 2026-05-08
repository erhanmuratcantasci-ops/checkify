"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { useTranslation } from "@/lib/i18n";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { easeOut } from "@/lib/motion";
import { HeroDashboardMockup } from "./HeroDashboardMockup";

export function MarketingHero() {
  const { t } = useTranslation();

  return (
    <section className="relative pt-10 md:pt-16">
      {/* Logo bar — quiet, sits inside the page-wide padding */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="mb-12 flex items-center justify-between md:mb-20"
      >
        <Link
          href="/"
          aria-label="Chekkify"
          className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)] rounded-md"
        >
          <Logo size="md" />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-[14px] font-medium text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)] md:inline-block"
          >
            Giriş yap
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-4 text-[13px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            Kayıt ol
          </Link>
        </div>
      </motion.div>

      {/* Hero copy */}
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.05 }}
          className="mx-auto max-w-[860px] text-[var(--color-fg)]"
          style={{
            fontSize: "clamp(44px, 8vw, 88px)",
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            lineHeight: 1.02,
            margin: 0,
          }}
        >
          <span className="block">{t("landing_hero_line1")}</span>
          <span className="block text-[var(--color-accent)]">
            {t("landing_hero_line2")}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.18 }}
          className="mx-auto mt-6 max-w-[640px] text-[var(--color-fg-muted)]"
          style={{
            fontSize: "clamp(16px, 1.6vw, 19px)",
            lineHeight: 1.55,
            letterSpacing: "var(--tracking-body)",
          }}
        >
          {t("landing_hero_subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.3 }}
          className="mx-auto mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href="/register"
            aria-label={t("landing_start_free")}
            className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)] rounded-[var(--radius-md)]"
          >
            <PrimaryActionButton type="button" block={false} className="px-7">
              {t("landing_start_free")}
              <ArrowRight size={16} aria-hidden />
            </PrimaryActionButton>
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex h-[52px] items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-6 text-[15px] font-medium text-[var(--color-fg)] transition-colors hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)]"
          >
            {t("landing_secondary_cta")} →
          </Link>
        </motion.div>
      </div>

      {/* Live dashboard mockup */}
      <div className="mt-16 md:mt-24">
        <HeroDashboardMockup />
      </div>
    </section>
  );
}
