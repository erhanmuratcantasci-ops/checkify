/**
 * Server-side validation for FORM builder schema (Sprint 7).
 *
 * Mirrors `dashboard/src/lib/formContract.ts` — keep in sync.
 * Schema shape is also persisted as `FormConfig.schema` Json + materialised
 * per-field rows in `FormField`. Validator here gates POST/PUT before the
 * write so Dalga 2/3 (CONVERT, PROTECT) can rely on well-formed payloads.
 */

import { z } from 'zod';

export const FORM_FIELD_TYPES = [
  'text',
  'email',
  'phone',
  'address',
  'city',
  'postal_code',
  'select',
  'radio',
  'checkbox',
  'textarea',
  'hidden',
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

const fieldValidationSchema = z
  .object({
    regex: z.string().max(500).optional(),
    min: z.number().int().optional(),
    max: z.number().int().optional(),
  })
  .strict()
  .optional();

const fieldOptionSchema = z
  .object({
    value: z.string().min(1).max(120),
    label: z.string().min(1).max(160),
  })
  .strict();

export const formFieldSchema = z
  .object({
    id: z.string().min(1).max(80),
    type: z.enum(FORM_FIELD_TYPES),
    label: z.string().min(1).max(200),
    placeholder: z.string().max(200).optional(),
    required: z.boolean(),
    order: z.number().int().min(0).max(999),
    validation: fieldValidationSchema,
    options: z.array(fieldOptionSchema).max(50).optional(),
  })
  .strict();

export const formSchemaPayload = z
  .object({
    fields: z.array(formFieldSchema).min(1).max(50),
  })
  .strict();

export type FormFieldInput = z.infer<typeof formFieldSchema>;
export type FormSchemaPayload = z.infer<typeof formSchemaPayload>;

export interface ValidationOk {
  ok: true;
  data: FormSchemaPayload;
}

export interface ValidationErr {
  ok: false;
  error: string;
  details?: unknown;
}

/**
 * Parses and validates a form schema. Returns a typed discriminated union
 * so callers can both narrow + propagate a readable error string.
 *
 * Extra invariants beyond zod:
 *   - field ids must be unique
 *   - select / radio fields must declare at least 1 option
 */
export function validateFormSchema(input: unknown): ValidationOk | ValidationErr {
  const parsed = formSchemaPayload.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Geçersiz form şeması', details: parsed.error.flatten() };
  }

  const ids = new Set<string>();
  for (const field of parsed.data.fields) {
    if (ids.has(field.id)) {
      return { ok: false, error: `Alan id tekrar ediyor: ${field.id}` };
    }
    ids.add(field.id);

    if ((field.type === 'select' || field.type === 'radio') && (!field.options || field.options.length === 0)) {
      return { ok: false, error: `${field.type} alanı için en az bir seçenek gerekli (${field.id})` };
    }
  }

  return { ok: true, data: parsed.data };
}
