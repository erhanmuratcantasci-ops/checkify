"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { easeOut } from "@/lib/motion";

/**
 * Quiet "infrastructure we trust" rail. Heading deliberately avoids
 * "Trusted by" / "Partners" phrasing — Chekkify uses these vendors,
 * but isn't formally endorsed by them. Logos rendered as inline SVGs
 * in fg-faint at low opacity (mono dim) so the rail reads as a
 * powered-by signal, not a customer-logo wall.
 */
export function LogoWall() {
  const { t } = useTranslation();
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: easeOut }}
      className="mt-24 md:mt-32"
      aria-label={t("landing_partners_heading")}
    >
      <p className="text-center text-[12px] uppercase tracking-[0.12em] text-[var(--color-fg-muted)]">
        {t("landing_partners_heading")}
      </p>
      <div
        className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14"
        style={{ color: "var(--color-fg-faint)" }}
      >
        <VercelMark />
        <CloudflareMark />
        <ResendMark />
        <RailwayMark />
        <ShopifyMark />
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------------- */
/* Inline mono SVGs — sized to ~22px height. currentColor inherits fg-faint. */
/* ------------------------------------------------------------------------- */

function VercelMark() {
  return (
    <span className="inline-flex items-center gap-2 opacity-65 transition-opacity hover:opacity-90">
      <svg width="20" height="18" viewBox="0 0 76 65" aria-hidden>
        <path fill="currentColor" d="M37.59.25l36.95 64H.64l36.95-64z" />
      </svg>
      <span className="text-[14px] font-medium tracking-tight">Vercel</span>
    </span>
  );
}

function CloudflareMark() {
  return (
    <span className="inline-flex items-center gap-2 opacity-65 transition-opacity hover:opacity-90">
      <svg width="26" height="22" viewBox="0 0 256 116" aria-hidden>
        <path
          fill="currentColor"
          d="M201.9 80.2L186.5 16c-1.4-5.7-5.4-9.7-10.7-11.1-2.6-0.7-65.7-0.4-65.7-0.4-2 0-3.7 1.3-4.4 3l-5.1 14.7s-22.6-1.7-26.7-1.4c-25.7 1.7-46 22.7-49.7 48.5C22.6 76 23 82 23.6 87.7c0.4 1.7 2 3 3.7 3l174-0.5c2 0 3.4-1.7 3-3.7l-2.4-6.3zm22 5.4c-2.4 9.4-7.4 17.4-14.4 22.6-7 5.4-15.7 8.4-25 8.7l-149 0.4c-1 0-1.7-1-1.4-2 0.7-3 2-5.7 4-7.7 1.7-1.7 4-2.7 6.4-3l139-0.5c8.7 0 16.7-5.7 19.4-14l5.7-15.4c2-5.4 1-11.4-2.4-15.7-3.4-4.4-8.7-7-14.4-7l-29-0.3c-1.4 0-2.4-1.7-2-3l4.7-13.4c1.4-4 4.7-6.7 8.7-7l52.7 0.5c5.4 0 10 3 12 8 1.4 4.4 1 9.4-1.4 13l-13.7 35z"
        />
      </svg>
      <span className="text-[14px] font-medium tracking-tight">Cloudflare</span>
    </span>
  );
}

function ResendMark() {
  return (
    <span className="inline-flex items-center gap-2 opacity-65 transition-opacity hover:opacity-90">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M3 3h11.4c4.5 0 7.6 3 7.6 6.6 0 3-1.9 5.3-4.6 6.2L23 21h-5.7l-4.9-4.5H8.4V21H3V3zm5.4 8.7h5.5c2 0 3.2-1 3.2-2.7s-1.2-2.7-3.2-2.7H8.4v5.4z"
        />
      </svg>
      <span className="text-[14px] font-medium tracking-tight">Resend</span>
    </span>
  );
}

function RailwayMark() {
  return (
    <span className="inline-flex items-center gap-2 opacity-65 transition-opacity hover:opacity-90">
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M2 4h2v16H2V4zm4 4h2v12H6V8zm4-4h2v16h-2V4zm4 6h2v10h-2V10zm4-2h2v12h-2V8zm4 4h2v8h-2v-8z"
        />
      </svg>
      <span className="text-[14px] font-medium tracking-tight">Railway</span>
    </span>
  );
}

function ShopifyMark() {
  return (
    <span className="inline-flex items-center gap-2 opacity-65 transition-opacity hover:opacity-90">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M14.6 4.2c-.4 0-.7.2-1 .4l-.4-1.5c-.1-.4-.5-.5-.8-.5l-1.3.4-2 8.5-2.5.8-.1 2.4 4.3 7.3 7-1.7-2-15.5c0-.3-.4-.6-.8-.6h-.4zm-2.7.7l-1.3 5.4-1.5.5 1.3-5.5 1.5-.4z"
        />
      </svg>
      <span className="text-[14px] font-medium tracking-tight">Shopify</span>
    </span>
  );
}
