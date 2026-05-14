"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  TrendingDown,
  Store,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  FileText,
  User,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type NavItem = { href: string; label: string; icon: LucideIcon };

const PLAN_TONE: Record<string, { tone: "neutral" | "accent" | "info" | "warning"; label: string }> = {
  FREE: { tone: "neutral", label: "Ücretsiz" },
  STARTER: { tone: "info", label: "Starter" },
  PRO: { tone: "accent", label: "Pro" },
  BUSINESS: { tone: "warning", label: "Business" },
};

function getToken() {
  if (typeof window === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [userName, setUserName] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [smsCredits, setSmsCredits] = useState<number | null>(null);
  const [whatsappCredits, setWhatsappCredits] = useState<number | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const u = data.user ?? data;
        setUserName(u.name ?? null);
        setUserPlan(u.plan ?? null);
        setSmsCredits(u.smsCredits ?? null);
        setWhatsappCredits(u.whatsappCredits ?? null);
      })
      .catch(() => null);
  }, []);

  function handleLogout() {
    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "refreshToken=; path=/; max-age=0";
    router.push("/login");
  }

  const navItems: NavItem[] = [
    { href: "/dashboard", label: t("nav_dashboard"), icon: LayoutDashboard },
    { href: "/orders", label: t("nav_orders"), icon: Package },
    { href: "/rto", label: "RTO", icon: TrendingDown },
    { href: "/shops", label: t("nav_shops"), icon: Store },
    { href: "/credits", label: t("nav_credits"), icon: Wallet },
    { href: "/sms-logs", label: "SMS geçmişi", icon: MessageSquare },
    { href: "/blocklist", label: "Engel listesi", icon: ShieldAlert },
    { href: "/blocking-rules", label: "Gelişmiş engelleme", icon: ShieldCheck },
    { href: "/forms", label: t("nav_forms"), icon: FileText },
    { href: "/profile", label: t("nav_profile"), icon: User },
  ];

  const initials =
    userName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || null;
  const plan = userPlan ? PLAN_TONE[userPlan] : null;

  const aside = (
    <aside
      className={cn(
        "flex h-full w-[240px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)]",
        "px-3 pb-4 pt-5"
      )}
    >
      <Link
        href="/dashboard"
        aria-label="Chekkify"
        className="mb-6 inline-flex px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)] rounded-md"
      >
        <Logo size="sm" />
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "group flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-[14px] font-medium",
                "transition-colors duration-150",
                active
                  ? "bg-[var(--color-accent-faded)] text-[var(--color-accent)] border border-[var(--color-accent)]/20"
                  : "border border-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
              )}
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-3 space-y-3 border-t border-[var(--color-border)] pt-3">
        {(smsCredits !== null || whatsappCredits !== null) && (
          <Link
            href="/credits"
            onClick={onClose}
            className="flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 hover:bg-[var(--color-surface-hover)]"
          >
            <span className="text-[12px] text-[var(--color-fg-muted)]">{t("nav_credits")}</span>
            <span className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-fg)]">
              {smsCredits !== null && (
                <span className="tabular-nums">{smsCredits.toLocaleString("tr-TR")}</span>
              )}
              {whatsappCredits !== null && (
                <span className="tabular-nums text-[var(--color-success)]">
                  ·{whatsappCredits.toLocaleString("tr-TR")}
                </span>
              )}
            </span>
          </Link>
        )}

        {plan && (
          <Link
            href="/pricing"
            onClick={onClose}
            className="flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 hover:bg-[var(--color-surface-hover)]"
          >
            <span className="text-[12px] text-[var(--color-fg-muted)]">Plan</span>
            <Badge tone={plan.tone}>{plan.label}</Badge>
          </Link>
        )}

        {userName && (
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 hover:bg-[var(--color-surface-hover)]"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-faded)] text-[11px] font-medium text-[var(--color-accent)]">
              {initials}
            </span>
            <span className="truncate text-[13px] font-medium text-[var(--color-fg)]">
              {userName}
            </span>
          </Link>
        )}

        <div className="flex items-center justify-between gap-2 px-1">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={handleLogout}
            aria-label={t("nav_logout")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
          >
            <LogOut size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <div className="hidden md:block">{aside}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            onClick={onClose}
            aria-hidden
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0">{aside}</div>
        </div>
      )}
    </>
  );
}
