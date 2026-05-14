/**
 * Sprint 7 — FORM contract.
 *
 * SHARED CONTRACT — Dalga 2 (Sprint 8 CONVERT upsell, Sprint 9 PIXEL) reads
 * `FormRenderPayload.hooks.upsellSlot` and `hooks.pixelSlot`. Do NOT rename
 * these fields without coordinating across waves.
 *
 * The backend mirror lives in `backend/src/lib/formSchema.ts` and the public
 * GET /forms/:id/render endpoint emits the exact shape of FormRenderPayload.
 */

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'postal_code'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'hidden';

export const FORM_FIELD_TYPES: FormFieldType[] = [
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
];

export interface FormFieldValidation {
  regex?: string;
  min?: number;
  max?: number;
}

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldSchema {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
  validation?: FormFieldValidation;
  options?: FormFieldOption[];
}

export interface FormSchemaPayload {
  fields: FormFieldSchema[];
}

export interface FormRenderHooks {
  /** Dalga 2 Sprint 8 — CONVERT upsell injection point. */
  upsellSlot: 'pre_submit' | 'post_submit' | null;
  /** Dalga 2 Sprint 9 — pixel tracker slot. */
  pixelSlot: 'on_view' | 'on_submit' | null;
}

export interface FormRenderPayload {
  formId: string;
  shopId: number;
  name: string;
  fields: FormFieldSchema[];
  hooks: FormRenderHooks;
}

export interface FormListItem {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { fields: number };
}

export interface FormDetail {
  id: string;
  shopId: number;
  name: string;
  isActive: boolean;
  schema: FormSchemaPayload;
  createdAt: string;
  updatedAt: string;
  fields: Array<{
    id: string;
    formConfigId: string;
    fieldType: FormFieldType;
    label: string;
    placeholder: string | null;
    required: boolean;
    validation: FormFieldValidation | null;
    order: number;
    options: FormFieldOption[] | null;
    createdAt: string;
  }>;
}

/**
 * Default fields suggested by the new-form template — Türkçe COD use case.
 * Matches the canonical address-form most Turkish merchants ship with.
 */
export function defaultFormFields(): FormFieldSchema[] {
  return [
    { id: 'name', type: 'text', label: 'Ad Soyad', required: true, order: 0, placeholder: 'Adınız Soyadınız' },
    { id: 'phone', type: 'phone', label: 'Telefon', required: true, order: 1, placeholder: '5xx xxx xx xx' },
    { id: 'email', type: 'email', label: 'E-posta', required: false, order: 2, placeholder: 'ornek@mail.com' },
    { id: 'address', type: 'address', label: 'Adres', required: true, order: 3 },
    { id: 'city', type: 'city', label: 'Şehir', required: true, order: 4 },
    { id: 'postal_code', type: 'postal_code', label: 'Posta Kodu', required: false, order: 5 },
  ];
}
