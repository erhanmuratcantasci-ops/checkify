"use client";

import { useDrag } from "react-dnd";
import {
  Type,
  Mail,
  Phone,
  MapPin,
  Building2,
  Hash,
  ListChecks,
  Circle,
  CheckSquare,
  AlignLeft,
  EyeOff,
  type LucideIcon,
} from "lucide-react";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import type { FormFieldType } from "@/lib/formContract";

export const PALETTE_DND_TYPE = "FORM_FIELD_PALETTE";

interface PaletteSpec {
  type: FormFieldType;
  icon: LucideIcon;
  labelKey: TranslationKey;
}

const PALETTE: PaletteSpec[] = [
  { type: "text", icon: Type, labelKey: "forms_field_text" },
  { type: "email", icon: Mail, labelKey: "forms_field_email" },
  { type: "phone", icon: Phone, labelKey: "forms_field_phone" },
  { type: "address", icon: MapPin, labelKey: "forms_field_address" },
  { type: "city", icon: Building2, labelKey: "forms_field_city" },
  { type: "postal_code", icon: Hash, labelKey: "forms_field_postal_code" },
  { type: "select", icon: ListChecks, labelKey: "forms_field_select" },
  { type: "radio", icon: Circle, labelKey: "forms_field_radio" },
  { type: "checkbox", icon: CheckSquare, labelKey: "forms_field_checkbox" },
  { type: "textarea", icon: AlignLeft, labelKey: "forms_field_textarea" },
  { type: "hidden", icon: EyeOff, labelKey: "forms_field_hidden" },
];

function PaletteItem({ spec }: { spec: PaletteSpec }) {
  const { t } = useTranslation();
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: PALETTE_DND_TYPE,
    item: { fieldType: spec.type },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const Icon = spec.icon;
  return (
    <div
      ref={dragRef as unknown as React.Ref<HTMLDivElement>}
      data-testid={`palette-${spec.type}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="flex cursor-grab items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface-hover)] active:cursor-grabbing"
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden />
      <span>{t(spec.labelKey)}</span>
    </div>
  );
}

export default function FieldPalette() {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-fg-muted)]">
        {t("forms_palette_title")}
      </div>
      <div className="text-[12px] text-[var(--color-fg-muted)]">{t("forms_palette_hint")}</div>
      <div className="grid grid-cols-1 gap-1.5 pt-1 sm:grid-cols-2">
        {PALETTE.map((spec) => (
          <PaletteItem key={spec.type} spec={spec} />
        ))}
      </div>
    </div>
  );
}
