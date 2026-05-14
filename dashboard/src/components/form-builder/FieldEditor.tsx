"use client";

import { Trash2, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import type { FormFieldSchema, FormFieldOption } from "@/lib/formContract";

interface FieldEditorProps {
  field: FormFieldSchema | null;
  onChange: (next: FormFieldSchema) => void;
  onDelete: () => void;
}

export default function FieldEditor({ field, onChange, onDelete }: FieldEditorProps) {
  const { t } = useTranslation();

  if (!field) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-6 text-center text-[13px] text-[var(--color-fg-muted)]">
        {t("forms_editor_empty")}
      </div>
    );
  }

  const showOptions = field.type === "select" || field.type === "radio";
  const showPlaceholder = field.type !== "checkbox" && field.type !== "hidden";

  function set<K extends keyof FormFieldSchema>(key: K, value: FormFieldSchema[K]) {
    onChange({ ...field!, [key]: value });
  }

  function setOption(index: number, patch: Partial<FormFieldOption>) {
    const next = [...(field!.options ?? [])];
    next[index] = { ...next[index]!, ...patch };
    set("options", next);
  }

  function addOption() {
    const next = [...(field!.options ?? []), { value: "", label: "" }];
    set("options", next);
  }

  function removeOption(index: number) {
    const next = (field!.options ?? []).filter((_, i) => i !== index);
    set("options", next);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-fg-muted)]">
          {t("forms_editor_title")}
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label={t("delete")}>
          <Trash2 size={14} strokeWidth={1.75} aria-hidden />
          {t("delete")}
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`fld-${field.id}-label`}>{t("forms_editor_label")}</Label>
        <Input
          id={`fld-${field.id}-label`}
          value={field.label}
          onChange={(e) => set("label", e.target.value)}
        />
      </div>

      {showPlaceholder && (
        <div className="space-y-2">
          <Label htmlFor={`fld-${field.id}-placeholder`}>{t("forms_editor_placeholder")}</Label>
          <Input
            id={`fld-${field.id}-placeholder`}
            value={field.placeholder ?? ""}
            onChange={(e) => set("placeholder", e.target.value || undefined)}
          />
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[var(--color-fg)]">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => set("required", e.target.checked)}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        {t("forms_editor_required")}
      </label>

      {showOptions && (
        <div className="space-y-2">
          <Label>{t("forms_editor_options")}</Label>
          <div className="space-y-2">
            {(field.options ?? []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder={t("forms_editor_option_value")}
                  value={opt.value}
                  onChange={(e) => setOption(i, { value: e.target.value })}
                  className="flex-1"
                />
                <Input
                  placeholder={t("forms_editor_option_label")}
                  value={opt.label}
                  onChange={(e) => setOption(i, { label: e.target.value })}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  aria-label={t("delete")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
                >
                  <X size={14} strokeWidth={1.75} aria-hidden />
                </button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={addOption}>
              <Plus size={14} strokeWidth={1.75} aria-hidden />
              {t("forms_editor_option_add")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
