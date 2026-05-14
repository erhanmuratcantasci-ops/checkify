"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, FileSpreadsheet, Plug } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

interface PixelStatus {
  provider: "meta" | "tiktok" | "google";
  enabled: boolean;
}

interface SheetsStatusResponse {
  status: { enabled: boolean };
}

export default function IntegrationsHubPage() {
  const { t } = useTranslation();
  const [pixelsEnabled, setPixelsEnabled] = useState<number | null>(null);
  const [sheetsEnabled, setSheetsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    apiRequest<{ providers: PixelStatus[] }>("/integrations/pixels")
      .then((data) => setPixelsEnabled(data.providers.filter((p) => p.enabled).length))
      .catch(() => setPixelsEnabled(0));
    apiRequest<SheetsStatusResponse>("/integrations/sheets")
      .then((data) => setSheetsEnabled(data.status.enabled))
      .catch(() => setSheetsEnabled(false));
  }, []);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-6 py-8 md:px-10 md:py-10">
      <header>
        <div className="mb-1 flex items-center gap-2 text-[12px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
          <Plug size={14} strokeWidth={1.75} aria-hidden /> Sprint 9
        </div>
        <h1
          className="text-[var(--color-fg)]"
          style={{ fontSize: 28, fontWeight: 500, letterSpacing: "var(--tracking-display)", margin: 0 }}
        >
          {t("integrations_title")}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">{t("integrations_subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/integrations/pixels" className="block">
          <Card className="h-full transition-shadow hover:shadow-[var(--shadow-md)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-faded)] text-[var(--color-accent)]">
                <Activity size={18} strokeWidth={1.75} aria-hidden />
              </span>
              {pixelsEnabled !== null && pixelsEnabled > 0 ? (
                <Badge tone="success">{t("integrations_status_enabled")} ({pixelsEnabled})</Badge>
              ) : (
                <Badge tone="neutral">{t("integrations_status_disabled")}</Badge>
              )}
            </div>
            <CardTitle>{t("integrations_pixels_card")}</CardTitle>
            <CardDescription className="mt-1">{t("integrations_pixels_desc")}</CardDescription>
            <p className="mt-4 text-[13px] font-medium text-[var(--color-accent)]">{t("integrations_configure")}</p>
          </Card>
        </Link>

        <Link href="/integrations/sheets" className="block">
          <Card className="h-full transition-shadow hover:shadow-[var(--shadow-md)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-faded)] text-[var(--color-accent)]">
                <FileSpreadsheet size={18} strokeWidth={1.75} aria-hidden />
              </span>
              {sheetsEnabled ? (
                <Badge tone="success">{t("integrations_status_enabled")}</Badge>
              ) : (
                <Badge tone="neutral">{t("integrations_status_disabled")}</Badge>
              )}
            </div>
            <CardTitle>{t("integrations_sheets_card")}</CardTitle>
            <CardDescription className="mt-1">{t("integrations_sheets_desc")}</CardDescription>
            <p className="mt-4 text-[13px] font-medium text-[var(--color-accent)]">{t("integrations_configure")}</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
