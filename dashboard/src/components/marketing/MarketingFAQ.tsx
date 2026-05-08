"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { easeOut } from "@/lib/motion";

const FAQ_KEYS = Array.from({ length: 8 }, (_, i) => i + 1);

export function MarketingFAQ() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <motion.section
      id="faq"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="py-24 md:py-32"
      aria-label="Sık sorulan sorular"
    >
      <header className="mb-12 text-center">
        <p className="mb-3 text-[12px] uppercase tracking-[0.08em] text-[var(--color-accent)]">
          Sık sorulan sorular
        </p>
        <h2
          className="mx-auto max-w-[640px] text-[var(--color-fg)]"
          style={{
            fontSize: "clamp(28px, 4.5vw, 44px)",
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          Aklındaki tüm soruların cevabı.
        </h2>
      </header>

      <ul className="mx-auto max-w-[760px] divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {FAQ_KEYS.map((i) => {
          const isOpen = open === i;
          // i18n keys are typed; build the key name dynamically and assert
          const q = t(`landing_faq_q${i}` as never);
          const a = t(`landing_faq_a${i}` as never);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)]"
              >
                <span className="text-[16px] font-medium text-[var(--color-fg)] md:text-[17px]">
                  {q}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: easeOut }}
                  className="shrink-0 text-[var(--color-fg-muted)]"
                >
                  <ChevronDown size={18} aria-hidden />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: easeOut }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 pr-10 text-[15px] leading-relaxed text-[var(--color-fg-muted)]">
                      {a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
