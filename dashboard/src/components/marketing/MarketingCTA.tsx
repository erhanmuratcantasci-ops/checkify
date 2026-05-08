"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { easeOut } from "@/lib/motion";

export function MarketingCTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: easeOut }}
      className="relative my-12 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-accent)]/30 px-6 py-16 text-center md:my-16 md:px-12 md:py-24"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, rgba(251,113,133,0.22) 0%, rgba(251,113,133,0.06) 60%, transparent 100%), var(--color-bg-elevated)",
      }}
    >
      {/* Subtle texture: top hairline + bottom hairline in coral */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/50 to-transparent"
      />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/20 to-transparent"
      />

      <h2
        className="mx-auto max-w-[640px] text-[var(--color-fg)]"
        style={{
          fontSize: "clamp(30px, 5vw, 48px)",
          fontWeight: 500,
          letterSpacing: "var(--tracking-display)",
          lineHeight: 1.08,
          margin: 0,
        }}
      >
        Bugün başla, ilk siparişin yarın doğrulansın.
      </h2>
      <p className="mx-auto mt-5 max-w-[520px] text-[16px] leading-relaxed text-[var(--color-fg-muted)]">
        14 gün ücretsiz dene. Kredi kartı yok, taahhüt yok. 30 saniyede
        Shopify mağazana bağlan.
      </p>

      <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <Link
          href="/register"
          aria-label="14 gün ücretsiz dene"
          className="inline-block rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)]"
        >
          <PrimaryActionButton type="button" block={false} className="px-7">
            14 gün ücretsiz dene
            <ArrowRight size={16} aria-hidden />
          </PrimaryActionButton>
        </Link>
        <Link
          href="#pricing"
          className="inline-flex h-[52px] items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-6 text-[15px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-surface-hover)]"
        >
          Planları gör
        </Link>
      </div>

      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--color-fg-muted)]">
        {[
          "Kredi kartı gerekmez",
          "30 saniyede kurulum",
          "İstediğin zaman iptal",
        ].map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <Check
              size={13}
              strokeWidth={2.5}
              aria-hidden
              className="text-[var(--color-accent)]"
            />
            {s}
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
