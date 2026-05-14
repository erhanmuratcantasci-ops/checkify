"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SheetsConnect } from "@/components/integrations/SheetsConnect";
import { ColumnMapper } from "@/components/integrations/ColumnMapper";

interface SheetsApi {
  status: { enabled: boolean; sheetIdMasked: string | null; hasRefreshToken: boolean };
  columns: readonly string[];
}

export default function SheetsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<SheetsApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<SheetsApi>("/integrations/sheets")
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  async function syncNow() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await apiRequest<{ enqueued: number }>("/integrations/sheets/active/sync", {
        method: "POST",
      });
      setSyncMsg(`${res.enqueued} ${t("integrations_sync_done")}`);
    } catch (err) {
      setSyncMsg((err as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 px-6 py-8 md:px-10 md:py-10">
      <header className="flex items-end justify-between gap-3">
        <div>
          <Link
            href="/integrations"
            className="text-[12px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            {t("integrations_back_hub")}
          </Link>
          <h1
            className="mt-2 text-[var(--color-fg)]"
            style={{ fontSize: 24, fontWeight: 500, letterSpacing: "var(--tracking-display)", margin: 0 }}
          >
            {t("integrations_sheets_card")}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">{t("integrations_sheets_desc")}</p>
        </div>
        <Button onClick={syncNow} disabled={syncing || !data?.status.enabled} loading={syncing} size="sm">
          <RefreshCw size={14} strokeWidth={1.75} aria-hidden />
          {t("integrations_sync_now_btn")}
        </Button>
      </header>

      {syncMsg && (
        <p className="text-[12px] text-[var(--color-fg-muted)]">{syncMsg}</p>
      )}

      {loading ? (
        <p className="text-[13px] text-[var(--color-fg-muted)]">{t("loading")}</p>
      ) : data ? (
        <div className="space-y-4">
          <SheetsConnect status={data.status} />
          <ColumnMapper columns={data.columns} />
        </div>
      ) : (
        <p className="text-[13px] text-[var(--color-fg-muted)]">{t("error_occurred")}</p>
      )}
    </div>
  );
}
