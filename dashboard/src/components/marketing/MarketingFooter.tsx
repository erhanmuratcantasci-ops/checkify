"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";

export function MarketingFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const navLinks = [
    { href: "/kvkk", label: t("landing_kvkk") },
    { href: "/terms", label: t("landing_terms") },
    { href: "/iletisim", label: t("landing_contact") },
  ];
  return (
    <footer className="mt-12 border-t border-[var(--color-border)] pt-12 pb-2">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo size="md" />
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
            {t("landing_footer_desc")}
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[13px] text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-6">
        <p className="text-[12px] text-[var(--color-fg-faint)]">© {year} Chekkify</p>
        <LanguageSwitcher variant="minimal" />
      </div>
    </footer>
  );
}
