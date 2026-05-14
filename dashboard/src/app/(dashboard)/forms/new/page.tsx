"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FormBuilderShell from "@/components/form-builder/FormBuilderShell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { defaultFormFields } from "@/lib/formContract";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Shop {
  id: number;
  name: string;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

function NewFormPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const queryShopId = params.get("shopId");
  const [shopId, setShopId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API}/shops`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const shops: Shop[] = data?.shops ?? [];
        if (shops.length === 0) {
          router.push("/shops");
          return;
        }
        const fromQuery = queryShopId ? parseInt(queryShopId) : NaN;
        const initial = Number.isFinite(fromQuery)
          ? shops.find((s) => s.id === fromQuery)?.id ?? shops[0].id
          : shops[0].id;
        setShopId(initial);
      })
      .finally(() => setLoading(false));
  }, [queryShopId, router]);

  if (loading || shopId == null) {
    return (
      <div className="mx-auto max-w-[1400px] p-6">
        <div className="text-[13px] text-[var(--color-fg-muted)]">{t("loading")}</div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 pt-6">
        <Link href="/forms">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
            {t("forms_back_list")}
          </Button>
        </Link>
        <div className="text-[12px] uppercase tracking-wide text-[var(--color-fg-muted)]">
          {t("forms_new_title")}
        </div>
      </div>
      <FormBuilderShell
        mode="new"
        shopId={shopId}
        initialName=""
        initialFields={defaultFormFields()}
      />
    </>
  );
}

export default function NewFormPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] p-6 text-[13px] text-[var(--color-fg-muted)]">Yükleniyor...</div>}>
      <NewFormPageInner />
    </Suspense>
  );
}
