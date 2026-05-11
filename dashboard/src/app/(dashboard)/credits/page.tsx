"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Smartphone,
  Lock,
  Download,
  CreditCard,
  Wallet,
  Inbox,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getToken() {
  return document.cookie.split("; ").find((r) => r.startsWith("token="))?.split("=")[1] ?? null;
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

interface Transaction {
  id: number;
  amount: number;
  type: "PURCHASE" | "USAGE" | "WHATSAPP_PURCHASE" | "ADMIN_GIFT";
  description: string;
  price?: number;
  createdAt: string;
}

const SMS_PRESETS = [100, 250, 500, 1000];
const WA_PRESETS = [100, 250, 500, 1000];
const SMS_UNIT = 0.6;
const WA_UNIT = 0.6;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CreditsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [credits, setCredits] = useState<number | null>(null);
  const [whatsappCredits, setWhatsappCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>("FREE");
  const [activeTab, setActiveTab] = useState<"sms" | "whatsapp">("sms");
  const [smsAmount, setSmsAmount] = useState<number>(100);
  const [smsCustom, setSmsCustom] = useState("");
  const [smsCustomMode, setSmsCustomMode] = useState(false);
  const [waAmount, setWaAmount] = useState<number>(100);
  const [waCustom, setWaCustom] = useState("");
  const [waCustomMode, setWaCustomMode] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([
      fetch(`${API}/credits`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/plans/current`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([data, planData]) => {
        setCredits(data.smsCredits ?? 0);
        setWhatsappCredits(data.whatsappCredits ?? 0);
        setTransactions(data.transactions || []);
        setUserPlan(planData.plan ?? "FREE");
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const refreshCredits = useCallback(async () => {
    const res = await fetch(`${API}/credits`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setCredits(data.smsCredits ?? 0);
      setWhatsappCredits(data.whatsappCredits ?? 0);
      setTransactions(data.transactions || []);
    }
  }, []);

  async function downloadInvoice(transactionId: number) {
    try {
      const res = await fetch(`${API}/credits/invoice/${transactionId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        showToast(t("credits_invoice_download_error"), "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chekkify-fatura-${transactionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast(t("credits_invoice_download_error"), "error");
    }
  }

  async function purchaseExtra(type: "sms" | "whatsapp") {
    if (userPlan === "FREE") {
      router.push("/pricing");
      return;
    }
    const raw =
      type === "sms"
        ? smsCustomMode
          ? parseInt(smsCustom)
          : smsAmount
        : waCustomMode
          ? parseInt(waCustom)
          : waAmount;
    const amount = raw;
    if (!amount || isNaN(amount) || amount < 100) {
      showToast(t("credits_min_purchase_error"), "error");
      return;
    }
    setPurchasing(true);
    try {
      const res = await fetch(`${API}/credits/extra`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ type, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.upgrade) {
          router.push("/pricing");
          return;
        }
        showToast(data.error || t("credits_purchase_error_toast"), "error");
        return;
      }
      showToast(
        t("credits_purchase_success_toast")
          .replace("{amount}", String(amount))
          .replace("{type}", type === "whatsapp" ? "WhatsApp" : "SMS")
          .replace("{price}", formatCurrency(data.totalPrice)),
        "success"
      );
      await refreshCredits();
    } catch {
      showToast(t("credits_purchase_error_toast"), "error");
    } finally {
      setPurchasing(false);
    }
  }

  const isWA = activeTab === "whatsapp";
  const balanceValue = isWA
    ? whatsappCredits.toLocaleString("tr-TR")
    : (credits ?? 0).toLocaleString("tr-TR");
  const purchaseAmount = isWA
    ? waCustomMode
      ? parseInt(waCustom) || 0
      : waAmount
    : smsCustomMode
      ? parseInt(smsCustom) || 0
      : smsAmount;
  const purchaseTotal = purchaseAmount * (isWA ? WA_UNIT : SMS_UNIT);
  const presets = isWA ? WA_PRESETS : SMS_PRESETS;
  const customMode = isWA ? waCustomMode : smsCustomMode;
  const customValue = isWA ? waCustom : smsCustom;
  const selectedAmount = isWA ? waAmount : smsAmount;

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-8 md:px-8 md:py-10">
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
      >
        <ArrowLeft size={14} aria-hidden />
        {t("back_dashboard")}
      </button>

      <header className="mb-6">
        <h1
          className="text-[var(--color-fg)]"
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            margin: 0,
          }}
        >
          {t("credits_title")}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">
          {t("credits_subtitle")}
        </p>
      </header>

      <div className="mb-5 inline-flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1">
        {(["sms", "whatsapp"] as const).map((tab) => {
          const active = activeTab === tab;
          const Icon = tab === "sms" ? Smartphone : MessageSquare;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-[calc(var(--radius-md)-2px)] px-3 text-[13px] font-medium transition-colors",
                active
                  ? "bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                  : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
              )}
            >
              <Icon size={14} aria-hidden />
              {tab === "sms" ? t("credits_sms_label") : t("credits_whatsapp_label")}
            </button>
          );
        })}
      </div>

      <Card className="mb-4">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
              {t("credits_current")}
            </p>
            {loading ? (
              <div className="mt-2 h-12 w-24 rounded-[var(--radius-sm)] bg-[var(--color-surface)]" />
            ) : (
              <p
                className="mt-1 text-[var(--color-fg)] tabular-nums"
                style={{
                  fontSize: 56,
                  fontWeight: 500,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {balanceValue}
              </p>
            )}
            <p className="mt-2 text-[12px] text-[var(--color-fg-faint)]">
              {t("credits_remaining")}
            </p>
          </div>
        </div>
      </Card>

      {userPlan === "FREE" ? (
        <Card className="mb-4 border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)]">
          <div className="flex items-start gap-3">
            <Lock
              size={18}
              aria-hidden
              className="mt-0.5 shrink-0 text-[var(--color-accent)]"
            />
            <div className="flex-1">
              <p className="text-[14px] font-medium text-[var(--color-fg)]">
                {t("credits_purchase_locked_title")}
              </p>
              <p className="mt-1 text-[13px] text-[var(--color-fg-muted)]">
                {t("credits_purchase_locked_desc")}
              </p>
            </div>
            <Button size="sm" onClick={() => router.push("/pricing")}>
              {t("credits_buy_plan_action")} <ArrowRight size={14} aria-hidden />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isWA ? (
                <MessageSquare
                  size={16}
                  aria-hidden
                  className="text-[var(--color-success)]"
                />
              ) : (
                <Smartphone
                  size={16}
                  aria-hidden
                  className="text-[var(--color-accent)]"
                />
              )}
              {isWA ? t("credits_extra_wa_title") : t("credits_extra_sms_title")}
            </CardTitle>
            <span className="text-[12px] text-[var(--color-fg-muted)]">
              {formatCurrency(isWA ? WA_UNIT : SMS_UNIT)} / {isWA ? t("credits_unit_wp") : t("credits_unit_sms")}
            </span>
          </CardHeader>

          <div className="mb-3 flex flex-wrap gap-2">
            {presets.map((n) => {
              const active = !customMode && selectedAmount === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    if (isWA) {
                      setWaAmount(n);
                      setWaCustomMode(false);
                      setWaCustom("");
                    } else {
                      setSmsAmount(n);
                      setSmsCustomMode(false);
                      setSmsCustom("");
                    }
                  }}
                  className={cn(
                    "h-10 rounded-[var(--radius-md)] border px-4 text-[13px] font-medium transition-colors tabular-nums",
                    active
                      ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                      : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
                  )}
                >
                  {n} {isWA ? t("credits_unit_wp") : t("credits_unit_sms")}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                if (isWA) {
                  setWaCustomMode(true);
                  setWaCustom("");
                } else {
                  setSmsCustomMode(true);
                  setSmsCustom("");
                }
              }}
              className={cn(
                "h-10 rounded-[var(--radius-md)] border px-4 text-[13px] font-medium transition-colors",
                customMode
                  ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
              )}
            >
              {t("credits_custom_amount_btn")}
            </button>
          </div>

          {customMode && (
            <div className="mb-3">
              <Label htmlFor="custom-amount" className="text-[12px]">
                {t("credits_custom_amount_label")}
              </Label>
              <Input
                id="custom-amount"
                type="number"
                min={100}
                placeholder={t("credits_custom_placeholder")}
                value={customValue}
                onChange={(e) =>
                  isWA ? setWaCustom(e.target.value) : setSmsCustom(e.target.value)
                }
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
            <div className="text-[13px] text-[var(--color-fg-muted)]">
              <span>{t("credits_total_label")} </span>
              <span
                className="font-medium tabular-nums"
                style={{
                  fontSize: 22,
                  color: "var(--color-fg)",
                  letterSpacing: "var(--tracking-heading)",
                }}
              >
                {formatCurrency(purchaseTotal)}
              </span>
              <span className="ml-2 text-[12px] text-[var(--color-fg-faint)] tabular-nums">
                ({purchaseAmount} × {formatCurrency(isWA ? WA_UNIT : SMS_UNIT)})
              </span>
            </div>
            <Button
              size="md"
              loading={purchasing}
              disabled={
                purchasing || (customMode && (!parseInt(customValue) || parseInt(customValue) < 100))
              }
              onClick={() => purchaseExtra(activeTab)}
            >
              <CreditCard size={14} aria-hidden />
              {t("credits_buy_action")}
            </Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <CardHeader className="px-6 pt-5">
          <CardTitle>{t("credits_transactions")}</CardTitle>
        </CardHeader>

        {loading ? (
          <div className="space-y-2 px-6 pb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-5 rounded-[var(--radius-sm)] bg-[var(--color-surface)]"
                style={{ width: `${70 + i * 8}%` }}
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState icon={Inbox} title={t("credits_no_transactions")} />
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {transactions.map((tx) => {
              const isPurchase = tx.type === "PURCHASE";
              const isWAPurchase = tx.type === "WHATSAPP_PURCHASE";
              const isPositive = isPurchase || isWAPurchase || tx.type === "ADMIN_GIFT";
              const Icon = isWAPurchase
                ? MessageSquare
                : isPurchase || tx.type === "ADMIN_GIFT"
                  ? Wallet
                  : Smartphone;
              const tone = isWAPurchase
                ? "success"
                : isPurchase || tx.type === "ADMIN_GIFT"
                  ? "success"
                  : "accent";
              return (
                <li
                  key={tx.id}
                  className="flex items-center gap-3 px-6 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)]"
                    aria-hidden
                  >
                    <Icon size={14} className="text-[var(--color-fg-muted)]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[var(--color-fg)]">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-[var(--color-fg-faint)] tabular-nums">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={tone}>
                      {isPositive ? "+" : ""}
                      {tx.amount.toLocaleString("tr-TR")}
                    </Badge>
                    {(isPurchase || isWAPurchase) &&
                      (["STARTER", "PRO", "BUSINESS"].includes(userPlan) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadInvoice(tx.id)}
                          aria-label={t("credits_invoice_aria")}
                          className="h-7"
                        >
                          <Download size={12} aria-hidden />
                          PDF
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push("/pricing")}
                          title={t("credits_invoice_locked_aria")}
                          className="h-7 text-[var(--color-fg-faint)]"
                        >
                          <Lock size={12} aria-hidden />
                          PDF
                        </Button>
                      ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
