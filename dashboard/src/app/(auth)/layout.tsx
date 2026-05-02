"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/Logo";
import BackgroundDecoration from "@/components/BackgroundDecoration";
import { logoIn, pageTransition } from "@/lib/motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackgroundDecoration />
      <main className="min-h-screen flex flex-col items-center px-6 pt-24 pb-16">
        <motion.div variants={logoIn} initial="initial" animate="animate" className="mb-12">
          <Link
            href="/"
            aria-label="Chekkify"
            className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)] rounded-md"
          >
            <Logo size="md" />
          </Link>
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
