"use client";

import { useState } from "react";
import { Smartphone, Monitor } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { FormFieldSchema } from "@/lib/formContract";

interface FormPreviewProps {
  name: string;
  fields: FormFieldSchema[];
}

type Viewport = "mobile" | "desktop";

function PreviewField({ field }: { field: FormFieldSchema }) {
  const common = "w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)]";

  if (field.type === "hidden") return null;

  if (field.type === "textarea") {
    return <textarea className={common + " min-h-[80px]"} placeholder={field.placeholder ?? ""} disabled />;
  }
  if (field.type === "checkbox") {
    return (
      <label className="inline-flex items-center gap-2 text-[13px] text-[var(--color-fg)]">
        <input type="checkbox" className="h-4 w-4 accent-[var(--color-accent)]" disabled />
        <span>{field.label}</span>
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <select className={common} disabled defaultValue="">
        <option value="" disabled>
          {field.placeholder ?? "—"}
        </option>
        {(field.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "radio") {
    return (
      <div className="flex flex-col gap-1.5">
        {(field.options ?? []).map((o) => (
          <label key={o.value} className="inline-flex items-center gap-2 text-[13px] text-[var(--color-fg)]">
            <input type="radio" name={field.id} className="h-4 w-4 accent-[var(--color-accent)]" disabled />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    );
  }

  const inputType =
    field.type === "email"
      ? "email"
      : field.type === "phone"
        ? "tel"
        : field.type === "postal_code"
          ? "text"
          : "text";

  return (
    <input
      type={inputType}
      className={common}
      placeholder={field.placeholder ?? ""}
      disabled
    />
  );
}

export default function FormPreview({ name, fields }: FormPreviewProps) {
  const { t } = useTranslation();
  const [viewport, setViewport] = useState<Viewport>("desktop");

  const widthClass = viewport === "mobile" ? "w-[320px]" : "w-full max-w-[480px]";

  const visible = fields.filter((f) => f.type !== "hidden");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-fg-muted)]">
          {t("forms_preview_title")}
        </div>
        <div className="inline-flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5">
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            aria-label={t("forms_preview_mobile")}
            className={
              "inline-flex h-7 w-8 items-center justify-center rounded-[6px] " +
              (viewport === "mobile"
                ? "bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]")
            }
          >
            <Smartphone size={14} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            aria-label={t("forms_preview_desktop")}
            className={
              "inline-flex h-7 w-8 items-center justify-center rounded-[6px] " +
              (viewport === "desktop"
                ? "bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]")
            }
          >
            <Monitor size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
        <div className={widthClass + " space-y-3"}>
          <div className="text-[14px] font-medium text-[var(--color-fg)]">{name || t("forms_preview_untitled")}</div>
          {visible.length === 0 ? (
            <div className="text-center text-[13px] text-[var(--color-fg-muted)]">
              {t("forms_preview_empty")}
            </div>
          ) : (
            visible.map((field) => (
              <div key={field.id} className="space-y-1">
                {field.type !== "checkbox" && (
                  <label className="block text-[12px] font-medium text-[var(--color-fg)]">
                    {field.label}
                    {field.required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
                  </label>
                )}
                <PreviewField field={field} />
              </div>
            ))
          )}
          <button
            type="button"
            disabled
            className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[13px] font-medium text-[var(--color-accent-fg)] opacity-70"
          >
            {t("forms_preview_submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
