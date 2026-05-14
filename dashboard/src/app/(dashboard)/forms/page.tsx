"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Power, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/api";
import type { FormListItem } from "@/lib/formContract";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Shop {
  id: number;
  name: string;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

export default function FormsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopId, setShopId] = useState<number | null>(null);
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  // Load shops
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetch(`${API}/shops`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.shops?.length) {
          setShops([]);
          setLoading(false);
          return;
        }
        setShops(data.shops);
        const stored = typeof window !== "undefined" ? localStorage.getItem("forms_shop_id") : null;
        const initial = stored ? parseInt(stored) : data.shops[0].id;
        setShopId(Number.isFinite(initial) ? initial : data.shops[0].id);
      })
      .catch(() => setLoading(false));
  }, [router]);

  // Load forms for selected shop
  useEffect(() => {
    if (shopId == null) return;
    setLoading(true);
    apiRequest<{ forms: FormListItem[] }>(`/forms?shopId=${shopId}`)
      .then((data) => setForms(data.forms))
      .catch(() => setForms([]))
      .finally(() => setLoading(false));
  }, [shopId]);

  function selectShop(id: number) {
    setShopId(id);
    if (typeof window !== "undefined") localStorage.setItem("forms_shop_id", String(id));
  }

  async function activate(form: FormListItem) {
    setActing(form.id);
    try {
      await apiRequest(`/forms/${form.id}/activate`, { method: "POST" });
      showToast(t("forms_activated"), "success");
      setForms((prev) =>
        prev.map((f) => ({ ...f, isActive: f.id === form.id }))
      );
    } catch {
      showToast(t("error_occurred"), "error");
    } finally {
      setActing(null);
    }
  }

  async function remove(form: FormListItem) {
    if (!confirm(t("forms_delete_confirm"))) return;
    setActing(form.id);
    try {
      await apiRequest(`/forms/${form.id}`, { method: "DELETE" });
      setForms((prev) => prev.filter((f) => f.id !== form.id));
      showToast(t("forms_deleted"), "success");
    } catch {
      showToast(t("error_occurred"), "error");
    } finally {
      setActing(null);
    }
  }

  const newHref = useMemo(() => (shopId ? `/forms/new?shopId=${shopId}` : "/forms/new"), [shopId]);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[var(--tracking-heading)] text-[var(--color-fg)]">
            {t("forms_title")}
          </h1>
          <p className="text-[13px] text-[var(--color-fg-muted)]">{t("forms_subtitle")}</p>
        </div>
        <Link href={newHref}>
          <Button>
            <Plus size={16} strokeWidth={1.75} aria-hidden />
            {t("forms_new_btn")}
          </Button>
        </Link>
      </div>

      {shops.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {shops.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectShop(s.id)}
              className={
                "rounded-[var(--radius-md)] border px-3 py-1.5 text-[13px] " +
                (s.id === shopId
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)]")
              }
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Card>
          <div className="text-[13px] text-[var(--color-fg-muted)]">{t("loading")}</div>
        </Card>
      ) : shops.length === 0 ? (
        <Card>
          <EmptyState
            title={t("forms_no_shop_title")}
            description={t("forms_no_shop_desc")}
            icon={FileText}
          />
        </Card>
      ) : forms.length === 0 ? (
        <Card>
          <EmptyState
            title={t("forms_empty_title")}
            description={t("forms_empty_desc")}
            icon={FileText}
            action={
              <Link href={newHref}>
                <Button>
                  <Plus size={16} strokeWidth={1.75} aria-hidden />
                  {t("forms_new_btn")}
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {forms.map((f) => (
            <Card key={f.id}>
              <CardHeader>
                <div className="flex flex-1 items-center gap-3">
                  <CardTitle className="truncate">{f.name}</CardTitle>
                  {f.isActive ? (
                    <Badge tone="accent">{t("forms_status_active")}</Badge>
                  ) : (
                    <Badge tone="neutral">{t("forms_status_inactive")}</Badge>
                  )}
                  <span className="text-[12px] text-[var(--color-fg-muted)]">
                    {f._count.fields} {t("forms_fields_count")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!f.isActive && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => activate(f)}
                      loading={acting === f.id}
                    >
                      <Power size={14} strokeWidth={1.75} aria-hidden />
                      {t("forms_activate_btn")}
                    </Button>
                  )}
                  <Link href={`/forms/${f.id}`}>
                    <Button variant="secondary" size="sm">
                      <Pencil size={14} strokeWidth={1.75} aria-hidden />
                      {t("edit")}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(f)}
                    loading={acting === f.id}
                  >
                    <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                    {t("delete")}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
