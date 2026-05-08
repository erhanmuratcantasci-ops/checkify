"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import BackgroundDecoration from "@/components/BackgroundDecoration";
import { logoIn, pageSlide } from "@/lib/motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <BackgroundDecoration />
      <main className="relative z-10 min-h-screen flex flex-col items-center px-6 pt-8 pb-16">
        <motion.div variants={logoIn} initial="initial" animate="animate" className="mb-10">
          <Link
            href="/"
            aria-label="Chekkify"
            className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)] rounded-md"
          >
            <Logo size="md" />
          </Link>
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            variants={pageSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );
}
