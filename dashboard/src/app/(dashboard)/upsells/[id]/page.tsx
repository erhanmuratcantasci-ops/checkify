"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation, TranslationKey } from "@/lib/i18n";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { OfferBuilder, OfferFormValues } from "@/components/upsell/OfferBuilder";
import { UpsellStats, UpsellStatsData } from "@/components/upsell/UpsellStats";

interface Offer {
  id: string;
  shopId: number;
  name: string;
  triggerType: "pre_purchase" | "post_purchase" | "thank_you";
  productId: string;
  variantId: string | null;
  discount: number | null;
  discountType: "percentage" | "fixed" | null;
  priority: number;
  isActive: boolean;
}

export default function EditUpsellPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [stats, setStats] = useState<UpsellStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiRequest<{ offer: Offer; stats: UpsellStatsData }>(`/upsells/${id}`)
      .then((data) => {
        setOffer(data.offer);
        setStats(data.stats);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(values: OfferFormValues) {
    setSubmitting(true);
    try {
      const body = {
        name: values.name,
        triggerType: values.triggerType,
        productId: values.productId,
        variantId: values.variantId || null,
        discount: values.discount ? Number(values.discount) : null,
        discountType: values.discountType || null,
        priority: Number(values.priority) || 0,
      };
      await apiRequest(`/upsells/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      showToast(t("upsells_saved"), "success");
      router.push("/upsells");
    } catch {
      showToast(t("error_occurred"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function activate() {
    if (!offer) return;
    try {
      await apiRequest(`/upsells/${offer.id}/activate`, { method: "POST" });
      setOffer({ ...offer, isActive: true });
      showToast(t("upsells_activated"), "success");
    } catch {
      showToast(t("error_occurred"), "error");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[760px] p-6">
        <Card>
          <div className="text-[13px] text-[var(--color-fg-muted)]">{t("loading")}</div>
        </Card>
      </div>
    );
  }

  if (notFound || !offer) {
    return (
      <div className="mx-auto max-w-[760px] p-6">
        <Card>
          <div className="text-[13px] text-[var(--color-fg-muted)]">{t("upsells_not_found")}</div>
        </Card>
      </div>
    );
  }

  const initial: OfferFormValues = {
    name: offer.name,
    triggerType: offer.triggerType,
    productId: offer.productId,
    variantId: offer.variantId ?? "",
    discount: offer.discount != null ? String(offer.discount) : "",
    discountType: offer.discountType ?? "",
    priority: String(offer.priority),
  };

  return (
    <div className="mx-auto max-w-[760px] space-y-6 p-6">
      <Link href="/upsells" className="text-[13px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
        {t("upsells_back")}
      </Link>
      <div className="flex items-center gap-3">
        <h1 className="text-[22px] font-medium tracking-[var(--tracking-heading)] text-[var(--color-fg)]">
          {offer.name}
        </h1>
        {offer.isActive ? (
          <Badge tone="accent">{t("upsells_status_active")}</Badge>
        ) : (
          <Badge tone="neutral">{t("upsells_status_inactive")}</Badge>
        )}
        <Badge tone="info">{t(`upsells_trigger_${offer.triggerType}` as TranslationKey)}</Badge>
        {!offer.isActive && (
          <Button variant="secondary" size="sm" onClick={activate}>
            {t("upsells_activate_btn")}
          </Button>
        )}
      </div>

      {stats && <UpsellStats stats={stats} />}

      <OfferBuilder initial={initial} submitting={submitting} onSubmit={handleSubmit} />
    </div>
  );
}
