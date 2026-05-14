/**
 * FORM builder API — Sprint 7.
 *
 * Endpoints (auth + shop-scope unless marked public):
 *   POST   /forms                       — create FormConfig (+ FormField rows)
 *   GET    /forms?shopId=X              — list shop's forms
 *   GET    /forms/:id                   — detail (config + fields)
 *   PUT    /forms/:id                   — replace schema (FormField rows reset)
 *   DELETE /forms/:id                   — soft delete (isActive=false + name suffix)
 *   POST   /forms/:id/activate          — activate this form, deactivate siblings
 *   GET    /forms/:id/render            — PUBLIC, returns FormRenderPayload
 *
 * The /render endpoint is no-auth on purpose — storefront / checkout script
 * tags fetch it cross-origin. It exposes the form contract (id, shopId,
 * name, fields, hooks) which Dalga 2 (upsell slots, Sprint 8) and Dalga 2
 * (pixel slots, Sprint 9) will consume verbatim. Do NOT add merchant PII
 * here.
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateFormSchema } from '../lib/formSchema';

const router = Router();

async function assertShopOwnership(userId: number, shopId: number): Promise<boolean> {
  const shop = await prisma.shop.findFirst({ where: { id: shopId, userId }, select: { id: true } });
  return !!shop;
}

async function loadOwnedForm(userId: number, formId: string) {
  return prisma.formConfig.findFirst({
    where: { id: formId, shop: { userId } },
    include: { fields: { orderBy: { order: 'asc' } } },
  });
}

// PUBLIC — must come before router.use(authenticate)
// GET /forms/:id/render
router.get('/:id/render', async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const form = await prisma.formConfig.findUnique({
    where: { id },
    include: { fields: { orderBy: { order: 'asc' } } },
  });

  if (!form || !form.isActive) {
    res.status(404).json({ error: 'Form bulunamadı' });
    return;
  }

  res.json({
    formId: form.id,
    shopId: form.shopId,
    name: form.name,
    fields: form.fields.map((f) => ({
      id: f.id,
      type: f.fieldType,
      label: f.label,
      placeholder: f.placeholder ?? undefined,
      required: f.required,
      order: f.order,
      validation: f.validation ?? undefined,
      options: f.options ?? undefined,
    })),
    hooks: {
      // Dalga 2 — Sprint 8 (CONVERT) will set this slot.
      upsellSlot: null,
      // Dalga 2 — Sprint 9 (PIXEL) will set this slot.
      pixelSlot: null,
    },
  });
});

router.use(authenticate);

// POST /forms
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { shopId, name, schema } = req.body as {
    shopId?: number;
    name?: string;
    schema?: unknown;
  };

  if (typeof shopId !== 'number' || !Number.isFinite(shopId)) {
    res.status(400).json({ error: 'shopId gerekli' });
    return;
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'name gerekli' });
    return;
  }
  if (!(await assertShopOwnership(req.userId!, shopId))) {
    res.status(404).json({ error: 'Shop bulunamadı' });
    return;
  }

  const validation = validateFormSchema(schema);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error, details: validation.details });
    return;
  }

  const created = await prisma.formConfig.create({
    data: {
      shopId,
      name: name.trim().slice(0, 120),
      isActive: false,
      schema: validation.data as unknown as object,
      fields: {
        create: validation.data.fields.map((f) => ({
          fieldType: f.type,
          label: f.label,
          placeholder: f.placeholder ?? null,
          required: f.required,
          order: f.order,
          validation: f.validation ? (f.validation as unknown as object) : undefined,
          options: f.options ? (f.options as unknown as object) : undefined,
        })),
      },
    },
    include: { fields: { orderBy: { order: 'asc' } } },
  });

  res.status(201).json({ form: created });
});

// GET /forms?shopId=X
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const shopId = parseInt(req.query['shopId'] as string);
  if (!Number.isFinite(shopId)) {
    res.status(400).json({ error: 'shopId gerekli' });
    return;
  }
  if (!(await assertShopOwnership(req.userId!, shopId))) {
    res.status(404).json({ error: 'Shop bulunamadı' });
    return;
  }

  const forms = await prisma.formConfig.findMany({
    where: { shopId },
    orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { fields: true } },
    },
  });

  res.json({ forms });
});

// GET /forms/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const form = await loadOwnedForm(req.userId!, id);
  if (!form) {
    res.status(404).json({ error: 'Form bulunamadı' });
    return;
  }
  res.json({ form });
});

// PUT /forms/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const { name, schema } = req.body as { name?: string; schema?: unknown };

  const existing = await loadOwnedForm(req.userId!, id);
  if (!existing) {
    res.status(404).json({ error: 'Form bulunamadı' });
    return;
  }

  const validation = validateFormSchema(schema);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error, details: validation.details });
    return;
  }

  // Replace strategy: drop all fields, recreate in one tx. Simpler than diff,
  // and FormConfig.schema (Json) is the canonical source-of-truth anyway.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.formField.deleteMany({ where: { formConfigId: id } });
    return tx.formConfig.update({
      where: { id },
      data: {
        ...(name && typeof name === 'string' ? { name: name.trim().slice(0, 120) } : {}),
        schema: validation.data as unknown as object,
        fields: {
          create: validation.data.fields.map((f) => ({
            fieldType: f.type,
            label: f.label,
            placeholder: f.placeholder ?? null,
            required: f.required,
            order: f.order,
            validation: f.validation ? (f.validation as unknown as object) : undefined,
            options: f.options ? (f.options as unknown as object) : undefined,
          })),
        },
      },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
  });

  res.json({ form: updated });
});

// DELETE /forms/:id — soft delete
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const existing = await loadOwnedForm(req.userId!, id);
  if (!existing) {
    res.status(404).json({ error: 'Form bulunamadı' });
    return;
  }

  await prisma.formConfig.update({
    where: { id },
    data: {
      isActive: false,
      name: existing.name.startsWith('[deleted] ') ? existing.name : `[deleted] ${existing.name}`.slice(0, 120),
    },
  });

  res.json({ success: true });
});

// POST /forms/:id/activate
router.post('/:id/activate', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const existing = await loadOwnedForm(req.userId!, id);
  if (!existing) {
    res.status(404).json({ error: 'Form bulunamadı' });
    return;
  }

  const activated = await prisma.$transaction(async (tx) => {
    await tx.formConfig.updateMany({
      where: { shopId: existing.shopId, id: { not: id } },
      data: { isActive: false },
    });
    return tx.formConfig.update({
      where: { id },
      data: { isActive: true },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
  });

  res.json({ form: activated });
});

export default router;
