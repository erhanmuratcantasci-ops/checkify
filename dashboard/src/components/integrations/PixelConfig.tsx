"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";

export type PixelProvider = "meta" | "tiktok" | "google";

export interface PixelProviderStatus {
  provider: PixelProvider;
  enabled: boolean;
  pixelIdMasked: string | null;
  testMode: boolean;
}

const ENV_VARS: Record<PixelProvider, string[]> = {
  meta: ["META_PIXEL_ID", "META_PIXEL_ACCESS_TOKEN", "META_PIXEL_TEST_EVENT_CODE (optional)"],
  tiktok: ["TIKTOK_PIXEL_ID", "TIKTOK_ACCESS_TOKEN", "TIKTOK_TEST_EVENT_CODE (optional)"],
  google: ["GOOGLE_ADS_CONVERSION_ID (Sprint 12 stub)"],
};

interface Props {
  status: PixelProviderStatus;
  isStub?: boolean;
}

export function PixelConfig({ status, isStub = false }: Props) {
  const { t } = useTranslation();
  const providerLabel =
    status.provider === "meta"
      ? t("integrations_provider_meta")
      : status.provider === "tiktok"
        ? t("integrations_provider_tiktok")
        : t("integrations_provider_google");

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle>{providerLabel}</CardTitle>
        <div className="flex items-center gap-2">
          {isStub && <Badge tone="warning">{t("integrations_provider_google_stub")}</Badge>}
          {status.enabled ? (
            <Badge tone="success">{t("integrations_status_enabled")}</Badge>
          ) : (
            <Badge tone="neutral">{t("integrations_status_disabled")}</Badge>
          )}
          {status.testMode && <Badge tone="info">{t("integrations_test_mode")}</Badge>}
        </div>
      </div>

      {status.pixelIdMasked && (
        <div className="mb-3 flex items-center gap-3 text-[13px]">
          <span className="text-[var(--color-fg-muted)]">{t("integrations_pixel_id_label")}:</span>
          <code className="rounded bg-[var(--color-surface)] px-2 py-0.5 font-mono tabular-nums text-[12px] text-[var(--color-fg)]">
            {status.pixelIdMasked}
          </code>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
          {status.enabled ? t("integrations_v1_env_set") : t("integrations_v1_env_vars_label")}
        </p>
        <ul className="space-y-0.5">
          {ENV_VARS[status.provider].map((v) => (
            <li key={v}>
              <code className="rounded bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[12px] text-[var(--color-fg)]">
                {v}
              </code>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <EventChip label={t("integrations_event_page_view")} />
        <EventChip label={t("integrations_event_add_to_cart")} />
        <EventChip label={t("integrations_event_purchase")} active={status.enabled} />
        <EventChip label={t("integrations_event_lead")} />
      </div>

      <CardDescription className="mt-4">{t("integrations_v1_env_notice")}</CardDescription>
    </Card>
  );
}

function EventChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center justify-center rounded-[var(--radius-md)] border px-2 py-1.5 text-center text-[11px] font-medium " +
        (active
          ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
          : "border-[var(--color-border)] text-[var(--color-fg-muted)]")
      }
    >
      {label}
    </span>
  );
}
