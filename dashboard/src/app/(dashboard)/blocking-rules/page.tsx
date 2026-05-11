"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ListChecks,
  Inbox,
  BarChart3,
  Settings as SettingsIcon,
  Store,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import RulesTab from "./components/RulesTab";
import BlockedOrdersTab from "./components/BlockedOrdersTab";
import StatsTab from "./components/StatsTab";
import SettingsTab from "./components/SettingsTab";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getToken() {
  if (typeof window === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

interface Shop {
  id: number;
  name: string;
  shopDomain: string | null;
}

type Tab = "rules" | "blocked-orders" | "stats" | "settings";

const TABS: { key: Tab; labelKey: TranslationKey; Icon: LucideIcon }[] = [
  { key: "rules", labelKey: "blocking_rules_tab", Icon: ListChecks },
  { key: "blocked-orders", labelKey: "blocking_orders_tab", Icon: Inbox },
  { key: "stats", labelKey: "blocking_stats_tab", Icon: BarChart3 },
  { key: "settings", labelKey: "blocking_settings_tab", Icon: SettingsIcon },
];

export default function BlockingRulesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("rules");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API}/shops`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const list: Shop[] = data.shops ?? data ?? [];
        setShops(list);
        if (list.length > 0) setSelectedShop(list[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
        <p className="text-[14px] text-[var(--color-fg-faint)]">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
      <header className="mb-6">
        <h1
          className="text-[var(--color-fg)]"
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            margin: 0,
          }}
        >
          {t("blocking_page_title")}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">
          {t("blocking_page_subtitle")}
        </p>
      </header>

      {shops.length === 0 ? (
        <Card>
          <EmptyState
            icon={Store}
            title={t("blocking_no_shop_title")}
            description={t("blocking_no_shop_desc")}
            action={
              <Link
                href="/shops"
                className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 text-[14px] font-medium text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
              >
                {t("dash_add_shop_cta")}
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {shops.length > 1 && (
            <Card className="mb-4">
              <Label htmlFor="shop-select">{t("blocking_select_shop_label")}</Label>
              <select
                id="shop-select"
                value={selectedShop ?? ""}
                onChange={(e) => setSelectedShop(Number(e.target.value))}
                className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-[14px] text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.shopDomain ? ` — ${s.shopDomain}` : ""}
                  </option>
                ))}
              </select>
            </Card>
          )}

          {selectedShop && (
            <>
              <div
                role="tablist"
                aria-label={t("blocking_tablist_label")}
                className="mb-5 flex flex-wrap gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1"
              >
                {TABS.map(({ key, labelKey, Icon }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(key)}
                      className={cn(
                        "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[calc(var(--radius-md)-2px)] px-3 text-[13px] font-medium transition-colors min-w-[140px]",
                        active
                          ? "bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                          : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
                      )}
                    >
                      <Icon size={15} aria-hidden />
                      {t(labelKey)}
                    </button>
                  );
                })}
              </div>

              {tab === "rules" && <RulesTab shopId={selectedShop} />}
              {tab === "blocked-orders" && <BlockedOrdersTab shopId={selectedShop} />}
              {tab === "stats" && <StatsTab shopId={selectedShop} />}
              {tab === "settings" && <SettingsTab shopId={selectedShop} />}
            </>
          )}
        </>
      )}
    </div>
  );
}
