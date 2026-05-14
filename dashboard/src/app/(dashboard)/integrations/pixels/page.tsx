"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { PixelConfig, type PixelProviderStatus } from "@/components/integrations/PixelConfig";

export default function PixelsPage() {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<PixelProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ providers: PixelProviderStatus[] }>("/integrations/pixels")
      .then((data) => setProviders(data.providers))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 px-6 py-8 md:px-10 md:py-10">
      <header>
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
          {t("integrations_pixels_card")}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">{t("integrations_pixels_desc")}</p>
      </header>

      {loading ? (
        <p className="text-[13px] text-[var(--color-fg-muted)]">{t("loading")}</p>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => (
            <PixelConfig key={p.provider} status={p} isStub={p.provider === "google"} />
          ))}
        </div>
      )}
    </div>
  );
}
