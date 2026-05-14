"use client";

import { useCallback, useRef } from "react";
import { useDrop, useDrag } from "react-dnd";
import { GripVertical, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { FormFieldSchema, FormFieldType } from "@/lib/formContract";
import { PALETTE_DND_TYPE } from "./FieldPalette";

export const ROW_DND_TYPE = "FORM_FIELD_ROW";

interface CanvasProps {
  fields: FormFieldSchema[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onAdd: (fieldType: FormFieldType, index?: number) => void;
  onDelete: (id: string) => void;
}

interface PaletteDragItem {
  fieldType: FormFieldType;
}

interface RowDragItem {
  index: number;
  id: string;
}

function Row({
  field,
  index,
  selected,
  onSelect,
  onReorder,
  onDelete,
}: {
  field: FormFieldSchema;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onDelete: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: ROW_DND_TYPE,
    item: { index, id: field.id } as RowDragItem,
    collect: (m) => ({ isDragging: m.isDragging() }),
  }), [index, field.id]);

  const [, dropRef] = useDrop<RowDragItem | PaletteDragItem, void, unknown>(() => ({
    accept: [ROW_DND_TYPE],
    hover(item) {
      if (!("index" in item)) return;
      if (item.index === index) return;
      onReorder(item.index, index);
      item.index = index;
    },
  }), [index, onReorder]);

  // Compose drag (handle) + drop (whole row) on the same DOM node.
  dragRef(dropRef(ref));

  return (
    <div
      ref={ref}
      onClick={() => onSelect(field.id)}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={
        "group flex items-center gap-3 rounded-[var(--radius-md)] border bg-[var(--color-bg-elevated)] px-3 py-2.5 transition-colors " +
        (selected
          ? "border-[var(--color-accent)] shadow-[var(--shadow-glow)]"
          : "border-[var(--color-border)] hover:border-[var(--color-accent)]/40")
      }
    >
      <span className="cursor-grab text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg)]" aria-hidden>
        <GripVertical size={16} strokeWidth={1.75} />
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-[var(--color-fg)]">{field.label || t("forms_field_unlabeled")}</span>
          {field.required && (
            <span className="text-[11px] font-medium text-[var(--color-danger)]">*</span>
          )}
        </div>
        <div className="text-[11px] uppercase tracking-wide text-[var(--color-fg-muted)]">{field.type}</div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(field.id);
        }}
        aria-label={t("delete")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-fg-muted)] opacity-0 transition-opacity hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-danger)] group-hover:opacity-100"
      >
        <Trash2 size={14} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}

export default function DragDropCanvas({
  fields,
  selectedId,
  onSelect,
  onReorder,
  onAdd,
  onDelete,
}: CanvasProps) {
  const { t } = useTranslation();

  const [{ isOver }, dropRef] = useDrop<PaletteDragItem, void, { isOver: boolean }>(() => ({
    accept: PALETTE_DND_TYPE,
    drop: (item) => {
      onAdd(item.fieldType);
    },
    collect: (m) => ({ isOver: m.isOver({ shallow: true }) }),
  }), [onAdd]);

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      dropRef(node);
    },
    [dropRef]
  );

  return (
    <div
      ref={setRef}
      className={
        "min-h-[280px] space-y-2 rounded-[var(--radius-md)] border-2 border-dashed p-3 transition-colors " +
        (isOver
          ? "border-[var(--color-accent)] bg-[var(--color-accent-faded)]"
          : "border-[var(--color-border)] bg-[var(--color-bg)]")
      }
    >
      {fields.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center text-center text-[13px] text-[var(--color-fg-muted)]">
          {t("forms_canvas_empty")}
        </div>
      ) : (
        fields.map((field, i) => (
          <Row
            key={field.id}
            field={field}
            index={i}
            selected={field.id === selectedId}
            onSelect={onSelect}
            onReorder={onReorder}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
