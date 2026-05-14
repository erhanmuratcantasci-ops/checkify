"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Power, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/Toast";
import { useTranslation, TranslationKey } from "@/lib/i18n";
import { apiRequest } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Shop {
  id: number;
  name: string;
}

interface OfferListItem {
  id: string;
  shopId: number;
  name: string;
  triggerType: "pre_purchase" | "post_purchase" | "thank_you";
  isActive: boolean;
  priority: number;
  _count: { events: number };
}

function getToken() {
  if (typeof window === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

export default function UpsellsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [offers, setOffers] = useState<OfferListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API}/shops`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setShops(data?.shops ?? []))
      .catch(() => setShops([]));

    apiRequest<{ offers: OfferListItem[] }>("/upsells")
      .then((data) => setOffers(data.offers))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, [router]);

  async function activate(offer: OfferListItem) {
    setActing(offer.id);
    try {
      await apiRequest(`/upsells/${offer.id}/activate`, { method: "POST" });
      showToast(t("upsells_activated"), "success");
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, isActive: true } : o))
      );
    } catch {
      showToast(t("error_occurred"), "error");
    } finally {
      setActing(null);
    }
  }

  async function remove(offer: OfferListItem) {
    if (!confirm(t("upsells_delete_confirm"))) return;
    setActing(offer.id);
    try {
      await apiRequest(`/upsells/${offer.id}`, { method: "DELETE" });
      setOffers((prev) => prev.filter((o) => o.id !== offer.id));
      showToast(t("upsells_deleted"), "success");
    } catch {
      showToast(t("error_occurred"), "error");
    } finally {
      setActing(null);
    }
  }

  const newHref = useMemo(
    () => (shops[0] ? `/upsells/new?shopId=${shops[0].id}` : "/upsells/new"),
    [shops]
  );

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[var(--tracking-heading)] text-[var(--color-fg)]">
            {t("upsells_title")}
          </h1>
          <p className="text-[13px] text-[var(--color-fg-muted)]">{t("upsells_subtitle")}</p>
        </div>
        <Link href={newHref}>
          <Button>
            <Plus size={16} strokeWidth={1.75} aria-hidden />
            {t("upsells_new_btn")}
          </Button>
        </Link>
      </div>

      {loading ? (
        <Card>
          <div className="text-[13px] text-[var(--color-fg-muted)]">{t("loading")}</div>
        </Card>
      ) : shops.length === 0 ? (
        <Card>
          <EmptyState
            title={t("upsells_no_shop_title")}
            description={t("upsells_no_shop_desc")}
            icon={Sparkles}
          />
        </Card>
      ) : offers.length === 0 ? (
        <Card>
          <EmptyState
            title={t("upsells_empty_title")}
            description={t("upsells_empty_desc")}
            icon={Sparkles}
            action={
              <Link href={newHref}>
                <Button>
                  <Plus size={16} strokeWidth={1.75} aria-hidden />
                  {t("upsells_new_btn")}
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {offers.map((o) => (
            <Card key={o.id}>
              <CardHeader>
                <div className="flex flex-1 items-center gap-3">
                  <CardTitle className="truncate">{o.name}</CardTitle>
                  {o.isActive ? (
                    <Badge tone="accent">{t("upsells_status_active")}</Badge>
                  ) : (
                    <Badge tone="neutral">{t("upsells_status_inactive")}</Badge>
                  )}
                  <Badge tone="info">
                    {t(`upsells_trigger_${o.triggerType}` as TranslationKey)}
                  </Badge>
                  <span className="text-[12px] text-[var(--color-fg-muted)]">
                    {o._count.events} {t("upsells_stats_shown").toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!o.isActive && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => activate(o)}
                      loading={acting === o.id}
                    >
                      <Power size={14} strokeWidth={1.75} aria-hidden />
                      {t("upsells_activate_btn")}
                    </Button>
                  )}
                  <Link href={`/upsells/${o.id}`}>
                    <Button variant="secondary" size="sm">
                      <Pencil size={14} strokeWidth={1.75} aria-hidden />
                      {t("edit")}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(o)}
                    loading={acting === o.id}
                  >
                    <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                    {t("delete")}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
