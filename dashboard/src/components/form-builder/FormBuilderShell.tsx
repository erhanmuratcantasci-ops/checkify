"use client";

import { useState, useCallback, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/api";
import type { FormFieldSchema, FormFieldType } from "@/lib/formContract";
import FieldPalette from "./FieldPalette";
import DragDropCanvas from "./DragDropCanvas";
import FieldEditor from "./FieldEditor";
import FormPreview from "./FormPreview";

function nextId(existing: FormFieldSchema[]): string {
  let i = existing.length + 1;
  while (existing.some((f) => f.id === `field_${i}`)) i++;
  return `field_${i}`;
}

function makeField(type: FormFieldType, order: number, id: string): FormFieldSchema {
  const base: FormFieldSchema = {
    id,
    type,
    label: type.charAt(0).toUpperCase() + type.slice(1).replace("_", " "),
    required: false,
    order,
  };
  if (type === "select" || type === "radio") {
    base.options = [
      { value: "opt1", label: "Seçenek 1" },
      { value: "opt2", label: "Seçenek 2" },
    ];
  }
  return base;
}

interface FormBuilderShellProps {
  mode: "new" | "edit";
  formId?: string;
  shopId?: number;
  initialName: string;
  initialFields: FormFieldSchema[];
}

export default function FormBuilderShell({
  mode,
  formId,
  shopId,
  initialName,
  initialFields,
}: FormBuilderShellProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [fields, setFields] = useState<FormFieldSchema[]>(initialFields);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialFields[0]?.id ?? null
  );
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => fields.find((f) => f.id === selectedId) ?? null,
    [fields, selectedId]
  );

  const handleAdd = useCallback((type: FormFieldType) => {
    setFields((prev) => {
      const id = nextId(prev);
      const f = makeField(type, prev.length, id);
      setSelectedId(id);
      return [...prev, f];
    });
  }, []);

  const handleReorder = useCallback((from: number, to: number) => {
    setFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next.map((f, i) => ({ ...f, order: i }));
    });
  }, []);

  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

  const handleDelete = useCallback((id: string) => {
    setFields((prev) => {
      const next = prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i }));
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  }, [selectedId]);

  const handleEditorChange = useCallback((next: FormFieldSchema) => {
    setFields((prev) => prev.map((f) => (f.id === next.id ? next : f)));
  }, []);

  const handleEditorDelete = useCallback(() => {
    if (selectedId) handleDelete(selectedId);
  }, [selectedId, handleDelete]);

  async function handleSave() {
    if (!name.trim()) {
      showToast(t("forms_save_name_required"), "error");
      return;
    }
    if (fields.length === 0) {
      showToast(t("forms_save_fields_required"), "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        schema: { fields },
      };
      if (mode === "new") {
        if (!shopId) {
          showToast(t("forms_save_shop_required"), "error");
          setSaving(false);
          return;
        }
        const result = await apiRequest<{ form: { id: string } }>("/forms", {
          method: "POST",
          body: JSON.stringify({ shopId, ...payload }),
        });
        showToast(t("forms_saved"), "success");
        router.push(`/forms/${result.form.id}`);
      } else {
        await apiRequest(`/forms/${formId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast(t("forms_saved"), "success");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("error_occurred");
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="mx-auto max-w-[1400px] space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="form-name">{t("forms_name_label")}</Label>
            <Input
              id="form-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("forms_name_placeholder")}
            />
          </div>
          <Button onClick={handleSave} loading={saving}>
            <Save size={16} strokeWidth={1.75} aria-hidden />
            {t("save")}
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr_320px]">
          <Card>
            <FieldPalette />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("forms_canvas_title")}</CardTitle>
            </CardHeader>
            <DragDropCanvas
              fields={fields}
              selectedId={selectedId}
              onSelect={handleSelect}
              onReorder={handleReorder}
              onAdd={handleAdd}
              onDelete={handleDelete}
            />
            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
              <FormPreview name={name} fields={fields} />
            </div>
          </Card>

          <Card>
            <FieldEditor
              field={selected}
              onChange={handleEditorChange}
              onDelete={handleEditorDelete}
            />
          </Card>
        </div>
      </div>
    </DndProvider>
  );
}
