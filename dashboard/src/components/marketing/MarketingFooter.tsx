import Link from "next/link";
import Logo from "@/components/Logo";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-[var(--color-border)] pt-12 pb-2">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo size="md" />
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
            Kapıda ödeme siparişlerini SMS ile otomatik doğrulayan Apple-pro
            COD asistanı.
          </p>
        </div>

        <nav aria-label="Alt bağlantılar">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { href: "/kvkk", label: "KVKK" },
              { href: "/terms", label: "Kullanım koşulları" },
              { href: "/iletisim", label: "İletişim" },
            ].map((l) => (
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
        <p className="text-[12px] text-[var(--color-fg-faint)]">
          © {year} Chekkify
        </p>
        <p className="text-[12px] text-[var(--color-fg-faint)]">
          Türkiye için tasarlandı.
        </p>
      </div>
    </footer>
  );
}
