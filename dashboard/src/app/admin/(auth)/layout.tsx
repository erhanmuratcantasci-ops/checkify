"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Logo";
import BackgroundDecoration from "@/components/BackgroundDecoration";
import { logoIn, pageTransition } from "@/lib/motion";

/**
 * Admin auth shell — same Apple-pro pattern as /(auth) but with a small
 * "Yönetici paneli" eyebrow under the wordmark so admins know they're in
 * the right place. Sits at /admin/(auth)/ so /admin/login and
 * /admin/reset-password share it; the /admin/(panel) route group has its
 * own (M2-style sidebar) layout.
 */
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackgroundDecoration />
      <main className="relative z-10 min-h-screen flex flex-col items-center px-6 pt-8 pb-16">
        <motion.div variants={logoIn} initial="initial" animate="animate" className="mb-10 flex flex-col items-center">
          <Link
            href="/"
            aria-label="Chekkify"
            className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)] rounded-md"
          >
            <Logo size="md" />
          </Link>
          <span className="mt-2 inline-flex items-center rounded-[var(--radius-full)] border border-[var(--color-accent)]/20 bg-[var(--color-accent-faded)] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-accent)]">
            Yönetici paneli
          </span>
        </motion.div>
        <motion.div
          variants={pageTransition}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </main>
    </>
  );
}
