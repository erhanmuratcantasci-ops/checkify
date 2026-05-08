"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CreditWarning from "@/components/CreditWarning";
import ShopGuard from "@/components/ShopGuard";
import Logo from "@/components/Logo";
import { Sidebar } from "@/components/ui/sidebar";
import { easeOut } from "@/lib/motion";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile-only top strip with menu trigger + brand */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 px-4 backdrop-blur-xl md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menü"
            className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
          >
            <Menu size={20} strokeWidth={1.75} aria-hidden />
          </button>
          <Link href="/dashboard" aria-label="Chekkify" className="inline-block">
            <Logo size="sm" />
          </Link>
          <span className="w-9" aria-hidden />
        </header>

        <CreditWarning />
        <ShopGuard />

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: easeOut }}
          className="min-w-0 flex-1"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
