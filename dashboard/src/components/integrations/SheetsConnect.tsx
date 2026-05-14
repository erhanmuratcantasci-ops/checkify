"use client";

import { useState } from "react";
import { FileSpreadsheet, ExternalLink } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

interface SheetsStatus {
  enabled: boolean;
  sheetIdMasked: string | null;
  hasRefreshToken: boolean;
}

interface Props {
  status: SheetsStatus;
}

export function SheetsConnect({ status }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startOAuth() {
    setError(null);
    setLoading(true);
    try {
      const data = await apiRequest<{ url: string }>("/integrations/sheets/auth-url");
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-faded)] text-[var(--color-accent)]">
            <FileSpreadsheet size={16} strokeWidth={1.75} aria-hidden />
          </span>
          <CardTitle>{t("integrations_sheets_card")}</CardTitle>
        </div>
        {status.enabled ? (
          <Badge tone="success">{t("integrations_status_enabled")}</Badge>
        ) : (
          <Badge tone="neutral">{t("integrations_status_disabled")}</Badge>
        )}
      </div>

      {status.sheetIdMasked && (
        <div className="mb-3 flex items-center gap-3 text-[13px]">
          <span className="text-[var(--color-fg-muted)]">{t("integrations_sheet_id_label")}:</span>
          <code className="rounded bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[12px] text-[var(--color-fg)]">
            {status.sheetIdMasked}
          </code>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
          {status.enabled ? t("integrations_v1_env_set") : t("integrations_v1_env_vars_label")}
        </p>
        <ul className="space-y-0.5">
          {[
            "GOOGLE_OAUTH_CLIENT_ID",
            "GOOGLE_OAUTH_CLIENT_SECRET",
            "GOOGLE_REFRESH_TOKEN",
            "GOOGLE_SHEET_ID",
          ].map((v) => (
            <li key={v}>
              <code className="rounded bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[12px] text-[var(--color-fg)]">
                {v}
              </code>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={startOAuth} loading={loading} disabled={loading} size="sm">
          <ExternalLink size={14} strokeWidth={1.75} aria-hidden />
          {t("integrations_sheets_connect_btn")}
        </Button>
      </div>

      {error && (
        <p className="mt-3 text-[12px] text-[var(--color-danger)]">{error}</p>
      )}

      <CardDescription className="mt-4">{t("integrations_v1_env_notice")}</CardDescription>
    </Card>
  );
}
