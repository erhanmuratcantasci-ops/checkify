"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { ProductPicker } from "./ProductPicker";
import { TriggerConfig, UpsellTrigger } from "./TriggerConfig";

export interface OfferFormValues {
  name: string;
  triggerType: UpsellTrigger;
  productId: string;
  variantId: string;
  discount: string;
  discountType: "percentage" | "fixed" | "";
  priority: string;
}

export interface OfferBuilderProps {
  initial?: Partial<OfferFormValues>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (v: OfferFormValues) => void | Promise<void>;
}

const DEFAULT: OfferFormValues = {
  name: "",
  triggerType: "pre_purchase",
  productId: "",
  variantId: "",
  discount: "",
  discountType: "",
  priority: "0",
};

export function OfferBuilder({ initial, submitting, submitLabel, onSubmit }: OfferBuilderProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<OfferFormValues>({ ...DEFAULT, ...initial });

  function update<K extends keyof OfferFormValues>(key: K, value: OfferFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <div className="space-y-4">
          <div>
            <Label htmlFor="upsell-name">{t("upsells_field_name")}</Label>
            <Input
              id="upsell-name"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={t("upsells_field_name_placeholder")}
              required
              disabled={submitting}
            />
          </div>
          <TriggerConfig
            value={values.triggerType}
            onChange={(v) => update("triggerType", v)}
            disabled={submitting}
          />
          <ProductPicker
            productId={values.productId}
            variantId={values.variantId}
            onProductIdChange={(v) => update("productId", v)}
            onVariantIdChange={(v) => update("variantId", v)}
            disabled={submitting}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="upsell-discount">{t("upsells_field_discount")}</Label>
              <Input
                id="upsell-discount"
                type="number"
                step="0.01"
                value={values.discount}
                onChange={(e) => update("discount", e.target.value)}
                placeholder="0"
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="upsell-discount-type">{t("upsells_field_discount_type")}</Label>
              <select
                id="upsell-discount-type"
                value={values.discountType}
                onChange={(e) =>
                  update("discountType", e.target.value as OfferFormValues["discountType"])
                }
                disabled={submitting}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[14px] text-[var(--color-fg)]"
              >
                <option value="">—</option>
                <option value="percentage">{t("upsells_discount_pct")}</option>
                <option value="fixed">{t("upsells_discount_fixed")}</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="upsell-priority">{t("upsells_field_priority")}</Label>
            <Input
              id="upsell-priority"
              type="number"
              value={values.priority}
              onChange={(e) => update("priority", e.target.value)}
              disabled={submitting}
            />
            <div className="mt-1 text-[12px] text-[var(--color-fg-muted)]">
              {t("upsells_field_priority_help")}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>
          {submitLabel ?? t("upsells_save")}
        </Button>
      </div>
    </form>
  );
}
