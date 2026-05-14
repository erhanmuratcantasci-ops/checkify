"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FormBuilderShell from "@/components/form-builder/FormBuilderShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/api";
import type { FormDetail, FormFieldSchema } from "@/lib/formContract";

export default function EditFormPage() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiRequest<{ form: FormDetail }>(`/forms/${id}`)
      .then((data) => setForm(data.form))
      .catch(() => setForm(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] p-6">
        <div className="text-[13px] text-[var(--color-fg-muted)]">{t("loading")}</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto max-w-[1400px] p-6">
        <div className="text-[13px] text-[var(--color-fg-muted)]">{t("forms_not_found")}</div>
      </div>
    );
  }

  // Prefer the materialised schema JSON; fall back to FormField rows.
  const initialFields: FormFieldSchema[] =
    form.schema?.fields && Array.isArray(form.schema.fields) && form.schema.fields.length > 0
      ? form.schema.fields
      : form.fields.map((f) => ({
          id: f.id,
          type: f.fieldType,
          label: f.label,
          placeholder: f.placeholder ?? undefined,
          required: f.required,
          order: f.order,
          validation: f.validation ?? undefined,
          options: f.options ?? undefined,
        }));

  return (
    <>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 pt-6">
        <Link href="/forms">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
            {t("forms_back_list")}
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {form.isActive ? (
            <Badge tone="accent">{t("forms_status_active")}</Badge>
          ) : (
            <Badge tone="neutral">{t("forms_status_inactive")}</Badge>
          )}
          <span className="text-[12px] uppercase tracking-wide text-[var(--color-fg-muted)]">
            {t("forms_edit_title")}
          </span>
        </div>
      </div>
      <FormBuilderShell
        mode="edit"
        formId={form.id}
        initialName={form.name}
        initialFields={initialFields}
      />
    </>
  );
}
