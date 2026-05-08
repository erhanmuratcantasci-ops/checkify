"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Link2,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  BookOpen,
  Lock,
  Plus,
} from "lucide-react";
import { SkeletonShopCard } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { useTranslation } from "@/lib/i18n";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const WEBHOOK_URL = "https://api.chekkify.com/webhook/orders/create";
const ALLOWED_VARS = [
  "{isim}",
  "{siparis_no}",
  "{link}",
  "{tutar}",
  "{status_link}",
  "{prepaid_link}",
];
const DEFAULT_TEMPLATE =
  "Merhaba {isim}, {siparis_no} numaralı siparişinizi onaylamak için: {link}";

interface Shop {
  id: number;
  name: string;
  shopDomain: string | null;
  webhookSecret: string | null;
  smsTemplate: string | null;
  smsStartHour: number;
  smsEndHour: number;
  createdAt: string;
  prepaidEnabled: boolean;
  prepaidDiscount: number;
  notificationChannel: string;
  shopifyConnected: boolean;
}

interface BlockedPhone {
  id: number;
  phone: string;
  createdAt: string;
}

interface BlockedPostalCode {
  id: number;
  postalCode: string;
  createdAt: string;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

function padHour(n: number) {
  return String(n).padStart(2, "0");
}

const hourOptions = Array.from({ length: 24 }, (_, i) => i);

// ─────────────────────────────────────────────────────────────────────────────
// Webhook setup guide modal
// ─────────────────────────────────────────────────────────────────────────────

function WebhookGuideModal({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  const { t } = useTranslation();
  const [secretVisible, setSecretVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const STEPS: { title: string; desc: React.ReactNode }[] = [
    { title: t("shops_guide_s1"), desc: t("shops_guide_s1_desc") },
    {
      title: t("shops_guide_s2"),
      desc: (
        <>
          Sol menüden <strong className="text-[var(--color-fg)]">Ayarlar</strong> →{" "}
          <strong className="text-[var(--color-fg)]">Bildirimler</strong> bölümüne git. Sayfanın
          en altında <strong className="text-[var(--color-fg)]">Webhook&apos;lar</strong>{" "}
          bölümünü bul.
        </>
      ),
    },
    { title: t("shops_guide_s3"), desc: t("shops_guide_s3_desc") },
    { title: t("shops_guide_s4"), desc: null },
    { title: t("shops_guide_s5"), desc: t("shops_guide_s5_desc") },
  ];

  const WEBHOOK_SETTINGS = [
    { label: t("shops_guide_event"), value: t("shops_guide_event_val") },
    { label: t("shops_guide_format"), value: "JSON" },
    { label: t("shops_guide_url_label"), value: WEBHOOK_URL },
    { label: t("shops_guide_version"), value: t("shops_guide_version_val") },
  ];

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.25, ease: easeOut }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-overlay)] shadow-[var(--shadow-lg)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-accent)]">
              {t("shops_guide_badge")}
            </p>
            <p
              className="mt-1 text-[var(--color-fg)]"
              style={{
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: "var(--tracking-heading)",
              }}
            >
              {shop.name}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Kapat"
            className="h-8 w-8 px-0"
          >
            <X size={16} aria-hidden />
          </Button>
        </header>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6">
          {STEPS.map((step, i) => {
            const isLast = i === STEPS.length - 1;
            return (
              <div key={i} className="relative flex gap-4">
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute left-[16px] top-9 bottom-[-24px] w-px bg-[var(--color-border)]"
                  />
                )}
                <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[12px] font-medium text-[var(--color-accent-fg)]">
                  {i + 1}
                </span>
                <div className="flex-1 pt-1">
                  <p className="mb-2 text-[14px] font-medium text-[var(--color-fg)]">
                    {step.title}
                  </p>
                  {i === 3 ? (
                    <ul className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                      {WEBHOOK_SETTINGS.map((s) => (
                        <li
                          key={s.label}
                          className="flex items-center justify-between gap-3 px-3 py-2.5"
                        >
                          <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--color-fg-muted)]">
                            {s.label}
                          </span>
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={cn(
                                "truncate text-right text-[13px]",
                                s.label === t("shops_guide_url_label")
                                  ? "font-mono text-[var(--color-accent)]"
                                  : "text-[var(--color-fg)]"
                              )}
                            >
                              {s.value}
                            </span>
                            {s.label === t("shops_guide_url_label") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copy(s.value, "url")}
                                className="h-7 px-2 text-[11px]"
                              >
                                {copied === "url" ? (
                                  <Check size={12} aria-hidden />
                                ) : (
                                  <Copy size={12} aria-hidden />
                                )}
                                {copied === "url" ? t("copied") : t("copy")}
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : i === 4 ? (
                    <div className="space-y-2">
                      <p className="text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
                        {step.desc as string}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <code
                          className={cn(
                            "flex-1 break-all rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 font-mono text-[12px]",
                            secretVisible
                              ? "text-[var(--color-fg)]"
                              : "tracking-[2px] text-[var(--color-fg-faint)]"
                          )}
                        >
                          {secretVisible
                            ? shop.webhookSecret || "—"
                            : "••••••••••••••••••••••••••••••••"}
                        </code>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSecretVisible((v) => !v)}
                        >
                          {secretVisible ? (
                            <EyeOff size={14} aria-hidden />
                          ) : (
                            <Eye size={14} aria-hidden />
                          )}
                          {secretVisible ? t("hide") : t("show")}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => shop.webhookSecret && copy(shop.webhookSecret, "secret")}
                        >
                          {copied === "secret" ? (
                            <Check size={14} aria-hidden />
                          ) : (
                            <Copy size={14} aria-hidden />
                          )}
                          {copied === "secret" ? t("copied") : t("copy")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
                      {step.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="border-t border-[var(--color-border)] px-6 py-4">
          <Button size="lg" block onClick={onClose}>
            {t("shops_guide_close")}
          </Button>
        </footer>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-shop section (expandable) helpers
// ─────────────────────────────────────────────────────────────────────────────

function SectionRow({
  label,
  value,
  action,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] py-4 first:border-t-0 first:pt-0">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
          {label}
        </p>
        <div className="mt-1 text-[13px] text-[var(--color-fg)]">{value}</div>
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function ShopsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>("FREE");

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [secretVisible, setSecretVisible] = useState<Record<number, boolean>>({});
  const [copiedSecret, setCopiedSecret] = useState<number | null>(null);
  const [templateEdit, setTemplateEdit] = useState<Record<number, string>>({});
  const [templateOpen, setTemplateOpen] = useState<Record<number, boolean>>({});
  const [templateSaving, setTemplateSaving] = useState<Record<number, boolean>>({});
  const [templateError, setTemplateError] = useState<Record<number, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [guideShop, setGuideShop] = useState<Shop | null>(null);

  const [scheduleEdit, setScheduleEdit] = useState<
    Record<number, { start: number; end: number }>
  >({});
  const [scheduleOpen, setScheduleOpen] = useState<Record<number, boolean>>({});
  const [scheduleSaving, setScheduleSaving] = useState<Record<number, boolean>>({});

  const [blockedPhones, setBlockedPhones] = useState<Record<number, BlockedPhone[]>>({});
  const [blockOpen, setBlockOpen] = useState<Record<number, boolean>>({});
  const [blockInput, setBlockInput] = useState<Record<number, string>>({});
  const [blockLoading, setBlockLoading] = useState<Record<number, boolean>>({});

  const [blockedPostalCodes, setBlockedPostalCodes] = useState<
    Record<number, BlockedPostalCode[]>
  >({});
  const [postalOpen, setPostalOpen] = useState<Record<number, boolean>>({});
  const [newPostalCode, setNewPostalCode] = useState<Record<number, string>>({});
  const [postalLoading, setPostalLoading] = useState<Record<number, boolean>>({});

  const [prepaidSaving, setPrepaidSaving] = useState<Record<number, boolean>>({});
  const [connectingShopId, setConnectingShopId] = useState<number | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetchShops();
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get("connected");
    if (connected) {
      showToast(`${decodeURIComponent(connected)} Shopify'a başarıyla bağlandı`, "success");
      window.history.replaceState({}, "", "/shops");
    }
    fetch(`${API}/plans/current`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setUserPlan(d.plan ?? "FREE"))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchShops() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/shops`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShops(data.shops ?? data);
    } catch {
      setShops([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleShopifyConnect(shop: Shop) {
    if (!shop.shopDomain) {
      showToast("Önce mağaza domain'i ekle (örn: magaza.myshopify.com)", "error");
      return;
    }
    setConnectingShopId(shop.id);
    try {
      const res = await fetch(
        `${API}/shopify/install?shop=${encodeURIComponent(shop.shopDomain)}&shopId=${shop.id}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata oluştu");
      window.location.href = data.url;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Hata oluştu", "error");
      setConnectingShopId(null);
    }
  }

  function validateTemplate(template: string): string | null {
    const found = template.match(/\{[^}]+\}/g) || [];
    const invalid = found.filter((v) => !ALLOWED_VARS.includes(v));
    if (invalid.length > 0) return `${t("shops_invalid_vars")} ${invalid.join(", ")}`;
    return null;
  }

  async function updatePrepaid(shopId: number, enabled: boolean, discount: number) {
    setPrepaidSaving((prev) => ({ ...prev, [shopId]: true }));
    await fetch(`${API}/shops/${shopId}/prepaid`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ prepaidEnabled: enabled, prepaidDiscount: discount }),
    });
    setPrepaidSaving((prev) => ({ ...prev, [shopId]: false }));
    fetchShops();
  }

  async function updateNotificationChannel(shopId: number, channel: string) {
    await fetch(`${API}/shops/${shopId}/notification-channel`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ notificationChannel: channel }),
    });
    fetchShops();
  }

  async function fetchBlocked(shopId: number) {
    try {
      const res = await fetch(`${API}/shops/${shopId}/blocked-phones`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setBlockedPhones((prev) => ({ ...prev, [shopId]: data.blocked ?? [] }));
    } catch {
      setBlockedPhones((prev) => ({ ...prev, [shopId]: [] }));
    }
  }

  async function loadPostalCodes(shopId: number) {
    try {
      const res = await fetch(`${API}/shops/${shopId}/blocked-postal-codes`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setBlockedPostalCodes((prev) => ({ ...prev, [shopId]: data.blocked ?? [] }));
    } catch {
      setBlockedPostalCodes((prev) => ({ ...prev, [shopId]: [] }));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch(`${API}/shops`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: newName, shopDomain: newDomain || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      setShops((prev) => [data.shop ?? data, ...prev]);
      setShowCreate(false);
      setNewName("");
      setNewDomain("");
      showToast(t("shops_toast_created"), "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("error_occurred");
      setCreateError(msg);
      showToast(msg, "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`${API}/shops/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) {
      setShops((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirm(null);
      showToast(t("shops_toast_deleted"), "info");
    } else {
      showToast(t("shops_toast_delete_error"), "error");
    }
  }

  async function handleSaveTemplate(id: number) {
    const template = templateEdit[id] ?? "";
    const err = validateTemplate(template);
    if (err) {
      setTemplateError((prev) => ({ ...prev, [id]: err }));
      return;
    }
    setTemplateSaving((prev) => ({ ...prev, [id]: true }));
    setTemplateError((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch(`${API}/shops/${id}/template`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ template }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      setShops((prev) =>
        prev.map((s) => (s.id === id ? { ...s, smsTemplate: data.template } : s))
      );
      setTemplateOpen((prev) => ({ ...prev, [id]: false }));
      showToast(t("shops_toast_template_saved"), "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("error_occurred");
      setTemplateError((prev) => ({ ...prev, [id]: msg }));
      showToast(msg, "error");
    } finally {
      setTemplateSaving((prev) => ({ ...prev, [id]: false }));
    }
  }

  function openTemplate(shop: Shop) {
    setTemplateEdit((prev) => ({
      ...prev,
      [shop.id]: shop.smsTemplate || DEFAULT_TEMPLATE,
    }));
    setTemplateError((prev) => ({ ...prev, [shop.id]: "" }));
    setTemplateOpen((prev) => ({ ...prev, [shop.id]: true }));
  }

  function openSchedule(shop: Shop) {
    setScheduleEdit((prev) => ({
      ...prev,
      [shop.id]: { start: shop.smsStartHour, end: shop.smsEndHour },
    }));
    setScheduleOpen((prev) => ({ ...prev, [shop.id]: true }));
  }

  async function handleSaveSchedule(id: number) {
    const { start, end } = scheduleEdit[id] ?? { start: 9, end: 21 };
    setScheduleSaving((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API}/shops/${id}/schedule`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ smsStartHour: start, smsEndHour: end }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      setShops((prev) =>
        prev.map((s) => (s.id === id ? { ...s, smsStartHour: start, smsEndHour: end } : s))
      );
      setScheduleOpen((prev) => ({ ...prev, [id]: false }));
      showToast(t("shops_toast_schedule_saved"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setScheduleSaving((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function toggleBlockSection(shopId: number) {
    const isOpen = blockOpen[shopId];
    if (!isOpen && !blockedPhones[shopId]) await fetchBlocked(shopId);
    setBlockOpen((prev) => ({ ...prev, [shopId]: !isOpen }));
  }

  async function handleAddBlocked(shopId: number) {
    const phone = (blockInput[shopId] ?? "").trim();
    if (!phone) return;
    setBlockLoading((prev) => ({ ...prev, [shopId]: true }));
    try {
      const res = await fetch(`${API}/shops/${shopId}/blocked-phones`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      setBlockedPhones((prev) => ({
        ...prev,
        [shopId]: [data.entry, ...(prev[shopId] ?? [])],
      }));
      setBlockInput((prev) => ({ ...prev, [shopId]: "" }));
      showToast(t("shops_toast_blocked_added"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setBlockLoading((prev) => ({ ...prev, [shopId]: false }));
    }
  }

  async function handleRemoveBlocked(shopId: number, phone: string) {
    const res = await fetch(
      `${API}/shops/${shopId}/blocked-phones/${encodeURIComponent(phone)}`,
      { method: "DELETE", headers: authHeaders() }
    );
    if (res.ok) {
      setBlockedPhones((prev) => ({
        ...prev,
        [shopId]: (prev[shopId] ?? []).filter((b) => b.phone !== phone),
      }));
      showToast(t("shops_toast_blocked_removed"), "info");
    } else {
      showToast(t("shops_toast_block_remove_error"), "error");
    }
  }

  async function togglePostalSection(shopId: number) {
    const isOpen = postalOpen[shopId];
    if (!isOpen && !blockedPostalCodes[shopId]) await loadPostalCodes(shopId);
    setPostalOpen((prev) => ({ ...prev, [shopId]: !isOpen }));
  }

  async function addPostalCode(shopId: number) {
    const postalCode = (newPostalCode[shopId] ?? "").trim();
    if (!postalCode) return;
    setPostalLoading((prev) => ({ ...prev, [shopId]: true }));
    try {
      const res = await fetch(`${API}/shops/${shopId}/blocked-postal-codes`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ postalCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error_occurred"));
      setBlockedPostalCodes((prev) => ({
        ...prev,
        [shopId]: [data.entry, ...(prev[shopId] ?? [])],
      }));
      setNewPostalCode((prev) => ({ ...prev, [shopId]: "" }));
      showToast("Posta kodu engellendi", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("error_occurred"), "error");
    } finally {
      setPostalLoading((prev) => ({ ...prev, [shopId]: false }));
    }
  }

  async function removePostalCode(shopId: number, postalCode: string) {
    const res = await fetch(
      `${API}/shops/${shopId}/blocked-postal-codes/${encodeURIComponent(postalCode)}`,
      { method: "DELETE", headers: authHeaders() }
    );
    if (res.ok) {
      setBlockedPostalCodes((prev) => ({
        ...prev,
        [shopId]: (prev[shopId] ?? []).filter((b) => b.postalCode !== postalCode),
      }));
      showToast("Posta kodu engeli kaldırıldı", "info");
    } else {
      showToast(t("shops_toast_block_remove_error"), "error");
    }
  }

  async function copyWebhookSecret(shop: Shop) {
    if (!shop.webhookSecret) return;
    await navigator.clipboard.writeText(shop.webhookSecret);
    setCopiedSecret(shop.id);
    setTimeout(() => setCopiedSecret(null), 2000);
  }

  return (
    <div className="mx-auto w-full max-w-[920px] px-6 py-8 md:px-8 md:py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-[var(--color-fg)]"
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "var(--tracking-display)",
              margin: 0,
            }}
          >
            {t("shops_title")}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">{t("shops_subtitle")}</p>
        </div>
        <Button
          size="md"
          onClick={() => {
            setShowCreate(true);
            setCreateError("");
          }}
        >
          <Plus size={16} aria-hidden />
          {t("shops_new")}
        </Button>
      </header>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonShopCard key={i} />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <Card>
          <EmptyState
            icon={Store}
            title={t("shops_empty_title")}
            description={t("shops_empty_desc")}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {shops.map((shop) => (
            <Card key={shop.id}>
              {/* Shop header */}
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      className="text-[var(--color-fg)]"
                      style={{
                        fontSize: 18,
                        fontWeight: 500,
                        letterSpacing: "var(--tracking-heading)",
                        margin: 0,
                      }}
                    >
                      {shop.name}
                    </h2>
                    {shop.shopifyConnected ? (
                      <Badge tone="success">
                        <CheckCircle2 size={11} aria-hidden /> Shopify bağlı
                      </Badge>
                    ) : (
                      <Badge tone="warning">
                        <AlertTriangle size={11} aria-hidden /> Bağlı değil
                      </Badge>
                    )}
                  </div>
                  {shop.shopDomain && (
                    <p className="mt-1 truncate font-mono text-[12px] text-[var(--color-accent)]">
                      {shop.shopDomain}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {shop.shopifyConnected ? (
                    <Button size="sm" variant="secondary" onClick={() => handleShopifyConnect(shop)}>
                      <CheckCircle2 size={14} aria-hidden />
                      Yeniden bağla
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      loading={connectingShopId === shop.id}
                      onClick={() => handleShopifyConnect(shop)}
                    >
                      <Link2 size={14} aria-hidden />
                      {connectingShopId === shop.id ? "Yönlendiriliyor…" : "Shopify'a bağla"}
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setGuideShop(shop)}>
                    <BookOpen size={14} aria-hidden />
                    {t("shops_setup_guide")}
                  </Button>
                  {deleteConfirm === shop.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[var(--color-danger)]">
                        {t("are_you_sure")}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDelete(shop.id)}
                        className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/[0.08]"
                      >
                        {t("yes_delete")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>
                        {t("cancel")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirm(shop.id)}
                      className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/[0.08]"
                    >
                      <Trash2 size={14} aria-hidden />
                      {t("delete")}
                    </Button>
                  )}
                </div>
              </div>

              {!shop.shopifyConnected && (
                <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/[0.06] p-3">
                  <AlertTriangle
                    size={16}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-[var(--color-warning)]"
                  />
                  <p className="text-[13px] text-[var(--color-fg-muted)]">
                    <span className="font-medium text-[var(--color-warning)]">
                      Shopify bağlantısı yok
                    </span>{" "}
                    — siparişleri otomatik almak için &quot;Shopify&apos;a bağla&quot;ya
                    tıkla.
                  </p>
                </div>
              )}

              {/* Webhook secret */}
              <SectionRow
                label={t("shops_webhook_secret")}
                value={
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      readOnly
                      value={
                        secretVisible[shop.id]
                          ? shop.webhookSecret || "—"
                          : "••••••••••••••••••••••••••••••••"
                      }
                      className="flex-1 min-w-[200px] font-mono text-[12px]"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setSecretVisible((prev) => ({ ...prev, [shop.id]: !prev[shop.id] }))
                      }
                    >
                      {secretVisible[shop.id] ? (
                        <EyeOff size={14} aria-hidden />
                      ) : (
                        <Eye size={14} aria-hidden />
                      )}
                      {secretVisible[shop.id] ? t("hide") : t("show")}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => copyWebhookSecret(shop)}>
                      {copiedSecret === shop.id ? (
                        <Check size={14} aria-hidden />
                      ) : (
                        <Copy size={14} aria-hidden />
                      )}
                      {copiedSecret === shop.id ? t("copied") : t("copy")}
                    </Button>
                  </div>
                }
              />

              {/* Notification channel */}
              <SectionRow
                label="Bildirim kanalı"
                value={
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "sms", label: "SMS", requiresPro: false },
                      { value: "whatsapp", label: "WhatsApp", requiresPro: true },
                      { value: "both", label: "Her ikisi", requiresPro: true },
                    ].map((opt) => {
                      const locked = opt.requiresPro && !["PRO", "BUSINESS"].includes(userPlan);
                      const active = shop.notificationChannel === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            locked
                              ? router.push("/pricing")
                              : updateNotificationChannel(shop.id, opt.value)
                          }
                          className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-full)] border px-3 text-[12px] font-medium transition-colors",
                            active
                              ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                              : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)]"
                          )}
                        >
                          {locked && <Lock size={11} aria-hidden />}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                }
              />

              {/* SMS template */}
              <div className="border-t border-[var(--color-border)] py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                    {t("shops_sms_template")}
                  </p>
                  {!templateOpen[shop.id] && (
                    <Button size="sm" variant="secondary" onClick={() => openTemplate(shop)}>
                      {t("edit")}
                    </Button>
                  )}
                </div>
                {templateOpen[shop.id] ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {ALLOWED_VARS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() =>
                            setTemplateEdit((prev) => ({
                              ...prev,
                              [shop.id]: (prev[shop.id] || "") + v,
                            }))
                          }
                          className="inline-flex h-7 items-center rounded-[var(--radius-sm)] border border-[var(--color-accent)]/20 bg-[var(--color-accent-faded)] px-2 font-mono text-[11px] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/[0.18]"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={templateEdit[shop.id] ?? ""}
                      onChange={(e) =>
                        setTemplateEdit((prev) => ({ ...prev, [shop.id]: e.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2.5 text-[14px] text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)]"
                    />
                    {templateError[shop.id] && (
                      <p className="text-[13px] text-[var(--color-danger)]">
                        {templateError[shop.id]}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        loading={templateSaving[shop.id]}
                        onClick={() => handleSaveTemplate(shop.id)}
                      >
                        {templateSaving[shop.id] ? t("saving") : t("save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setTemplateOpen((prev) => ({ ...prev, [shop.id]: false }))
                        }
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p
                    className={cn(
                      "mt-2 break-words text-[13px]",
                      shop.smsTemplate
                        ? "text-[var(--color-fg)]"
                        : "italic text-[var(--color-fg-muted)]"
                    )}
                  >
                    {shop.smsTemplate || DEFAULT_TEMPLATE}
                  </p>
                )}
              </div>

              {/* SMS schedule */}
              <div className="border-t border-[var(--color-border)] py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                      {t("shops_sms_hours")}
                    </p>
                    {!scheduleOpen[shop.id] && (
                      <p className="mt-1 text-[13px] text-[var(--color-fg)] tabular-nums">
                        {padHour(shop.smsStartHour ?? 9)}:00 — {padHour(shop.smsEndHour ?? 21)}
                        :00
                      </p>
                    )}
                  </div>
                  {!scheduleOpen[shop.id] && (
                    <Button size="sm" variant="secondary" onClick={() => openSchedule(shop)}>
                      {t("edit")}
                    </Button>
                  )}
                </div>
                {scheduleOpen[shop.id] && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {(["start", "end"] as const).map((kind) => (
                        <div key={kind} className="flex items-center gap-2">
                          <span className="text-[12px] text-[var(--color-fg-muted)]">
                            {kind === "start" ? t("shops_start") : t("shops_end")}
                          </span>
                          <select
                            value={
                              scheduleEdit[shop.id]?.[kind] ??
                              (kind === "start" ? shop.smsStartHour : shop.smsEndHour)
                            }
                            onChange={(e) =>
                              setScheduleEdit((prev) => ({
                                ...prev,
                                [shop.id]: {
                                  start: prev[shop.id]?.start ?? shop.smsStartHour,
                                  end: prev[shop.id]?.end ?? shop.smsEndHour,
                                  [kind]: parseInt(e.target.value),
                                },
                              }))
                            }
                            className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 text-[13px] text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]"
                          >
                            {hourOptions.map((h) => (
                              <option key={h} value={h}>
                                {padHour(h)}:00
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        loading={scheduleSaving[shop.id]}
                        onClick={() => handleSaveSchedule(shop.id)}
                      >
                        {scheduleSaving[shop.id] ? t("saving") : t("save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setScheduleOpen((prev) => ({ ...prev, [shop.id]: false }))
                        }
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Blocked phones */}
              <div className="border-t border-[var(--color-border)] py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                      {t("shops_blocked_phones")}
                    </p>
                    {!blockOpen[shop.id] && (
                      <p className="mt-1 text-[13px] text-[var(--color-fg-muted)]">
                        {blockedPhones[shop.id]?.length
                          ? `${blockedPhones[shop.id].length} ${t("shops_blocked_count")}`
                          : t("shops_no_blocked")}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toggleBlockSection(shop.id)}
                  >
                    {blockOpen[shop.id] ? t("close") : t("manage")}
                  </Button>
                </div>
                {blockOpen[shop.id] && (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={blockInput[shop.id] ?? ""}
                        onChange={(e) =>
                          setBlockInput((prev) => ({ ...prev, [shop.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddBlocked(shop.id);
                        }}
                        placeholder="+905xxxxxxxxx"
                      />
                      <Button
                        size="md"
                        loading={blockLoading[shop.id]}
                        onClick={() => handleAddBlocked(shop.id)}
                      >
                        {t("shops_add_block")}
                      </Button>
                    </div>
                    {(blockedPhones[shop.id] ?? []).length === 0 ? (
                      <p className="text-[13px] text-[var(--color-fg-muted)]">
                        {t("shops_no_blocked")}
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {(blockedPhones[shop.id] ?? []).map((b) => (
                          <li
                            key={b.id}
                            className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                          >
                            <span className="font-mono text-[13px] text-[var(--color-fg)] tabular-nums">
                              {b.phone}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label="Kaldır"
                              onClick={() => handleRemoveBlocked(shop.id, b.phone)}
                              className="h-7 w-7 px-0 text-[var(--color-fg-muted)] hover:bg-[var(--color-danger)]/[0.08] hover:text-[var(--color-danger)]"
                            >
                              <X size={14} aria-hidden />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Blocked postal codes */}
              <div className="border-t border-[var(--color-border)] py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                      Engellenen posta kodları
                    </p>
                    {!postalOpen[shop.id] && (
                      <p className="mt-1 text-[13px] text-[var(--color-fg-muted)]">
                        {blockedPostalCodes[shop.id]?.length
                          ? `${blockedPostalCodes[shop.id].length} posta kodu engellendi`
                          : "Engellenen posta kodu yok"}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => togglePostalSection(shop.id)}
                  >
                    {postalOpen[shop.id] ? t("close") : t("manage")}
                  </Button>
                </div>
                {postalOpen[shop.id] && (
                  <div className="mt-3 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newPostalCode[shop.id] ?? ""}
                        onChange={(e) =>
                          setNewPostalCode((prev) => ({ ...prev, [shop.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addPostalCode(shop.id);
                        }}
                        placeholder="34xxx"
                      />
                      <Button
                        size="md"
                        loading={postalLoading[shop.id]}
                        onClick={() => addPostalCode(shop.id)}
                      >
                        Ekle
                      </Button>
                    </div>
                    {(blockedPostalCodes[shop.id] ?? []).length === 0 ? (
                      <p className="text-[13px] text-[var(--color-fg-muted)]">
                        Engellenen posta kodu yok
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {(blockedPostalCodes[shop.id] ?? []).map((b) => (
                          <li
                            key={b.id}
                            className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                          >
                            <span className="font-mono text-[13px] text-[var(--color-fg)] tabular-nums">
                              {b.postalCode}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label="Kaldır"
                              onClick={() => removePostalCode(shop.id, b.postalCode)}
                              className="h-7 w-7 px-0 text-[var(--color-fg-muted)] hover:bg-[var(--color-danger)]/[0.08] hover:text-[var(--color-danger)]"
                            >
                              <X size={14} aria-hidden />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Prepaid */}
              <div className="border-t border-[var(--color-border)] py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                      Ön ödeme teşviki
                    </p>
                    <p className="mt-1 text-[13px] text-[var(--color-fg-muted)]">
                      {shop.prepaidEnabled
                        ? `Aktif · %${shop.prepaidDiscount} indirim`
                        : "Kapalı"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={shop.prepaidEnabled}
                      onClick={() =>
                        updatePrepaid(shop.id, !shop.prepaidEnabled, shop.prepaidDiscount)
                      }
                      className={cn(
                        "relative h-6 w-10 rounded-full transition-colors",
                        shop.prepaidEnabled
                          ? "bg-[var(--color-accent)]"
                          : "bg-[var(--color-border-strong)]"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                          shop.prepaidEnabled && "translate-x-4"
                        )}
                      />
                    </button>
                    {shop.prepaidEnabled && (
                      <div className="flex gap-1">
                        {[5, 10, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => updatePrepaid(shop.id, true, pct)}
                            className={cn(
                              "inline-flex h-7 items-center rounded-[var(--radius-full)] border px-2.5 text-[12px] font-medium transition-colors tabular-nums",
                              shop.prepaidDiscount === pct
                                ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                                : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)]"
                            )}
                          >
                            %{pct}
                          </button>
                        ))}
                      </div>
                    )}
                    {prepaidSaving[shop.id] && (
                      <span className="text-[12px] text-[var(--color-fg-faint)]">Kaydediliyor…</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AnimatePresence>
        {guideShop && <WebhookGuideModal shop={guideShop} onClose={() => setGuideShop(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowCreate(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: easeOut }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-overlay)] p-7 shadow-[var(--shadow-lg)]"
            >
              <h2
                className="mb-5 text-[var(--color-fg)]"
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: "var(--tracking-heading)",
                }}
              >
                {t("shops_modal_title")}
              </h2>
              {createError && (
                <p className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.08] px-3 py-2 text-[13px] text-[var(--color-danger)]">
                  {createError}
                </p>
              )}
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="shop-name">{t("shops_name_label")}</Label>
                  <Input
                    id="shop-name"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t("shops_name_placeholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="shop-domain">{t("shops_domain_label")}</Label>
                  <Input
                    id="shop-domain"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder={t("shops_domain_placeholder")}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button type="submit" size="lg" block loading={creating}>
                    {creating ? t("creating") : t("create")}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    block
                    onClick={() => setShowCreate(false)}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
