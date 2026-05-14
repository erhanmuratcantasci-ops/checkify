"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";

export interface ProductPickerProps {
  productId: string;
  variantId: string;
  onProductIdChange: (v: string) => void;
  onVariantIdChange: (v: string) => void;
  disabled?: boolean;
}

export function ProductPicker({
  productId,
  variantId,
  onProductIdChange,
  onVariantIdChange,
  disabled,
}: ProductPickerProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="upsell-product-id">{t("upsells_field_product")}</Label>
        <Input
          id="upsell-product-id"
          value={productId}
          onChange={(e) => onProductIdChange(e.target.value)}
          placeholder={t("upsells_field_product_placeholder")}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="upsell-variant-id">{t("upsells_field_variant")}</Label>
        <Input
          id="upsell-variant-id"
          value={variantId}
          onChange={(e) => onVariantIdChange(e.target.value)}
          placeholder="gid://shopify/ProductVariant/…"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
