"use client";

/**
 * Sprint 8 CONVERT — UpsellSlot.
 *
 * Consumes `formContract.hooks.upsellSlot` ('pre_submit' | 'post_submit' | null)
 * and renders a single eligible offer. Storefront/form-renderer mounts this
 * twice (pre + post) and each instance no-ops if the hook value differs.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface RenderPayload {
  offerId: string;
  triggerType: string;
  product: { id: string; title: string; image: string | null; price: number; currency: string };
  originalPrice: number;
  discountedPrice: number;
  discount: number | null;
  discountType: "percentage" | "fixed" | null;
}

export interface UpsellSlotProps {
  shopId: number;
  /** Hook value from FormRenderPayload.hooks.upsellSlot */
  slot: "pre_submit" | "post_submit" | null;
  /** Which trigger this mount represents — must match a configured offer */
  triggerType: "pre_purchase" | "post_purchase" | "thank_you";
  onAccept?: (offerId: string) => void;
  onDecline?: (offerId: string) => void;
}

function trackEvent(offerId: string, eventType: string) {
  fetch(`${API}/upsells/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ offerId, eventType }),
  }).catch((err) => console.error("[upsell] track failed:", err));
}

export function UpsellSlot({ shopId, slot, triggerType, onAccept, onDecline }: UpsellSlotProps) {
  const { t } = useTranslation();
  const [payload, setPayload] = useState<RenderPayload | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (slot === null) return;
    let cancelled = false;
    fetch(`${API}/upsells/render?shopId=${shopId}&triggerType=${triggerType}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.payload) return;
        setPayload(data.payload);
        trackEvent(data.payload.offerId, "shown");
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [shopId, slot, triggerType]);

  if (slot === null || !payload || dismissed) return null;

  function handleAccept() {
    if (!payload) return;
    trackEvent(payload.offerId, "accepted");
    onAccept?.(payload.offerId);
    setDismissed(true);
  }

  function handleDecline() {
    if (!payload) return;
    trackEvent(payload.offerId, "declined");
    onDecline?.(payload.offerId);
    setDismissed(true);
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)]/10 p-4">
      <div className="flex items-center gap-3">
        {payload.product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={payload.product.image} alt={payload.product.title} className="h-16 w-16 rounded-md object-cover" />
        )}
        <div className="flex-1">
          <div className="text-[15px] font-medium text-[var(--color-fg)]">{payload.product.title}</div>
          <div className="flex items-center gap-2 text-[13px]">
            {payload.discount && (
              <span className="text-[var(--color-fg-muted)] line-through">
                {payload.originalPrice.toFixed(2)} {payload.product.currency}
              </span>
            )}
            <span className="font-medium text-[var(--color-accent)]">
              {payload.discountedPrice.toFixed(2)} {payload.product.currency}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3 py-2 text-[13px] font-medium text-white hover:opacity-90"
        >
          {t("upsells_stats_accepted")}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-[13px] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)]"
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
}
