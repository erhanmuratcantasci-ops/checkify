"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { OfferBuilder, OfferFormValues } from "@/components/upsell/OfferBuilder";
import { Card } from "@/components/ui/card";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Shop {
  id: number;
  name: string;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

function NewUpsellInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API}/shops`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list: Shop[] = data?.shops ?? [];
        setShops(list);
        const fromQuery = params.get("shopId");
        const initial = fromQuery ? Number(fromQuery) : list[0]?.id ?? null;
        setShopId(initial);
      })
      .catch(() => setShops([]));
  }, [router, params]);

  async function handleSubmit(values: OfferFormValues) {
    if (!shopId) {
      showToast(t("upsells_no_shop_title"), "error");
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        shopId,
        name: values.name,
        triggerType: values.triggerType,
        productId: values.productId,
        variantId: values.variantId || null,
        discount: values.discount ? Number(values.discount) : null,
        discountType: values.discountType || null,
        priority: Number(values.priority) || 0,
      };
      await apiRequest("/upsells", {
        method: "POST",
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

  return (
    <div className="mx-auto max-w-[760px] space-y-6 p-6">
      <Link href="/upsells" className="text-[13px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
        {t("upsells_back")}
      </Link>
      <h1 className="text-[22px] font-medium tracking-[var(--tracking-heading)] text-[var(--color-fg)]">
        {t("upsells_new_btn")}
      </h1>
      {shops.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {shops.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setShopId(s.id)}
              className={
                "rounded-[var(--radius-md)] border px-3 py-1.5 text-[13px] " +
                (s.id === shopId
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)]")
              }
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <OfferBuilder submitting={submitting} onSubmit={handleSubmit} />
    </div>
  );
}

export default function NewUpsellPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[760px] p-6">
          <Card>
            <div className="text-[13px] text-[var(--color-fg-muted)]">…</div>
          </Card>
        </div>
      }
    >
      <NewUpsellInner />
    </Suspense>
  );
}
