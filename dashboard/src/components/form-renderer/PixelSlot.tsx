"use client";

/**
 * Sprint 9 INTEGRATE — client-side pixel hook consumer.
 *
 * Reads `FormRenderPayload.hooks.pixelSlot` and fires the matching event
 * stage:
 *   - `'on_view'`  → fires on mount (PageView / ViewContent)
 *   - `'on_submit'` → fires when the host form submits (Lead)
 *   - `null`       → renders nothing, never fires
 *
 * Pixel IDs come from public NEXT_PUBLIC_* env vars (client-side fbq / ttq /
 * gtag). Server-side Conversions API events live in
 * `backend/src/lib/pixelInjection.ts` — the two are independent and
 * deduplicate via `event_id = order_<id>`.
 *
 * IMPORTANT: this component is a pure consumer of formContract.hooks.pixelSlot.
 * Do not modify formContract.ts itself — that file is shared with Dalga 1.
 */

import { useEffect } from "react";
import type { FormRenderPayload } from "@/lib/formContract";

type Fbq = ((cmd: string, eventName: string, params?: Record<string, unknown>) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
};

type Ttq = {
  track?: (eventName: string, params?: Record<string, unknown>) => void;
  page?: () => void;
};

declare global {
  interface Window {
    fbq?: Fbq;
    ttq?: Ttq;
    gtag?: (...args: unknown[]) => void;
  }
}

interface PixelSlotProps {
  payload: FormRenderPayload;
  /** when stage matches hooks.pixelSlot we fire — call this from the form on submit */
  stage?: "on_view" | "on_submit";
}

function firePageView() {
  if (typeof window === "undefined") return;
  if (typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
  window.ttq?.page?.();
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view");
  }
}

function fireLead(payload: FormRenderPayload) {
  if (typeof window === "undefined") return;
  const params = { content_name: payload.name, form_id: payload.formId };
  if (typeof window.fbq === "function") {
    window.fbq("track", "Lead", params);
  }
  window.ttq?.track?.("SubmitForm", params);
  if (typeof window.gtag === "function") {
    window.gtag("event", "generate_lead", params);
  }
}

export function PixelSlot({ payload, stage = "on_view" }: PixelSlotProps) {
  const slot = payload.hooks?.pixelSlot ?? null;

  useEffect(() => {
    if (slot === null) return;
    if (slot !== stage) return;
    if (slot === "on_view") {
      firePageView();
    } else if (slot === "on_submit") {
      fireLead(payload);
    }
  }, [slot, stage, payload]);

  // Pixel slot is invisible — server-side render absent.
  return null;
}

/**
 * Programmatic fire — call from your form's submit handler when you cannot
 * gate the component render. Mirrors PixelSlot's `'on_submit'` branch.
 */
export function fireOnSubmit(payload: FormRenderPayload) {
  if (payload.hooks?.pixelSlot === "on_submit") fireLead(payload);
}
