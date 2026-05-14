"use client";

import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type UpsellTrigger = "pre_purchase" | "post_purchase" | "thank_you";

export interface TriggerConfigProps {
  value: UpsellTrigger;
  onChange: (v: UpsellTrigger) => void;
  disabled?: boolean;
}

const OPTIONS: UpsellTrigger[] = ["pre_purchase", "post_purchase", "thank_you"];

export function TriggerConfig({ value, onChange, disabled }: TriggerConfigProps) {
  const { t } = useTranslation();
  return (
    <div>
      <Label>{t("upsells_field_trigger")}</Label>
      <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {OPTIONS.map((trigger) => {
          const active = value === trigger;
          return (
            <button
              key={trigger}
              type="button"
              disabled={disabled}
              onClick={() => onChange(trigger)}
              className={cn(
                "rounded-[var(--radius-md)] border px-3 py-2 text-left text-[13px]",
                "transition-colors duration-150",
                active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)]"
              )}
            >
              {t(`upsells_trigger_${trigger}` as never)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
