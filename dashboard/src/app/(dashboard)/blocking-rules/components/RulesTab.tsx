"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Lock, Trash2, Plus } from "lucide-react";
import { ApiError, blockingRules, BlockingRule, BlockingRuleType } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type FormState = {
  ruleType: BlockingRuleType;
  value: string;
  reason: string;
};

const RULE_TYPES: BlockingRuleType[] = [
  "IP_ADDRESS",
  "IP_RANGE",
  "PHONE_PATTERN",
  "EMAIL_DOMAIN",
  "CUSTOMER_NAME",
  "MAX_ORDERS_PER_PHONE",
  "MAX_ORDERS_PER_IP",
];

const RULE_META: Record<
  BlockingRuleType,
  { label: string; placeholder: string; groupTitle: string; hint?: string }
> = {
  IP_ADDRESS: {
    label: "IP adresi",
    placeholder: "192.168.1.100",
    groupTitle: "IP adresi kuralları",
  },
  IP_RANGE: {
    label: "IP aralığı (CIDR)",
    placeholder: "192.168.1.0/24",
    groupTitle: "IP aralığı kuralları",
    hint: "IPv4 CIDR formatı (ör. 10.0.0.0/8)",
  },
  PHONE_PATTERN: {
    label: "Telefon deseni (Regex)",
    placeholder: "^\\+905551.*",
    groupTitle: "Telefon desen kuralları",
    hint: "JavaScript regex deseni",
  },
  EMAIL_DOMAIN: {
    label: "Email alan adı",
    placeholder: "tempmail.com",
    groupTitle: "Email alan adı kuralları",
  },
  CUSTOMER_NAME: {
    label: "Müşteri adı (içeren)",
    placeholder: "Ahmet",
    groupTitle: "Müşteri adı kuralları",
  },
  MAX_ORDERS_PER_PHONE: {
    label: "Telefon başına sipariş limiti",
    placeholder: "3",
    groupTitle: "Telefon başına limit",
    hint: "30 gün içinde izin verilen maksimum sipariş",
  },
  MAX_ORDERS_PER_IP: {
    label: "IP başına sipariş limiti",
    placeholder: "5",
    groupTitle: "IP başına limit",
    hint: "30 gün içinde izin verilen maksimum sipariş",
  },
};

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ay önce`;
  return `${Math.floor(months / 12)} yıl önce`;
}

export default function RulesTab({ shopId }: { shopId: number }) {
  const [rules, setRules] = useState<BlockingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [planError, setPlanError] = useState<{ feature: string } | null>(null);
  const [form, setForm] = useState<FormState>({
    ruleType: "IP_ADDRESS",
    value: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blockingRules.list(shopId);
      setRules(res.rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kurallar yüklenemedi");
    }
    setLoading(false);
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!form.value.trim()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setPlanError(null);
    try {
      await blockingRules.create({
        shopId,
        ruleType: form.ruleType,
        value: form.value.trim(),
        reason: form.reason.trim() || null,
      });
      setForm({ ruleType: form.ruleType, value: "", reason: "" });
      setSuccess("Kural eklendi.");
      setTimeout(() => setSuccess(null), 3000);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && err.body["upgrade"]) {
        const feature =
          typeof err.body["requiredFeature"] === "string"
            ? err.body["requiredFeature"]
            : "advanced_blocking";
        setPlanError({ feature });
      } else {
        setError(err instanceof Error ? err.message : "Kural eklenemedi");
      }
    }
    setSubmitting(false);
  }

  async function handleDelete(rule: BlockingRule) {
    const ok = window.confirm(`"${rule.value}" kuralını silmek istediğine emin misin?`);
    if (!ok) return;
    const prev = rules;
    setRules((r) => r.filter((x) => x.id !== rule.id));
    try {
      await blockingRules.delete(rule.id, shopId);
    } catch (err) {
      setRules(prev);
      setError(err instanceof Error ? err.message : "Kural silinemedi");
    }
  }

  async function handleToggle(rule: BlockingRule) {
    const prev = rules;
    setRules((r) => r.map((x) => (x.id === rule.id ? { ...x, isActive: !x.isActive } : x)));
    try {
      await blockingRules.toggle(rule.id, shopId);
    } catch (err) {
      setRules(prev);
      setError(err instanceof Error ? err.message : "Durum güncellenemedi");
    }
  }

  const grouped = RULE_TYPES.map((rt) => ({
    ruleType: rt,
    items: rules.filter((r) => r.ruleType === rt),
  })).filter((g) => g.items.length > 0);

  const meta = RULE_META[form.ruleType];

  return (
    <>
      {planError && (
        <Card className="mb-4 border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.06]">
          <div className="flex items-start gap-3">
            <Lock
              size={18}
              aria-hidden
              className="mt-0.5 shrink-0 text-[var(--color-danger)]"
            />
            <div className="flex-1">
              <p className="text-[14px] font-medium text-[var(--color-danger)]">
                {planError.feature === "rate_limit_blocking"
                  ? "Starter plan gerekli"
                  : "Pro plan gerekli"}
              </p>
              <p className="mt-1 text-[13px] text-[var(--color-fg-muted)]">
                {planError.feature === "rate_limit_blocking"
                  ? "Sipariş limit kuralları Starter ve üzeri planlarda kullanılabilir."
                  : "Bu kural türü Pro ve üzeri planlarda kullanılabilir."}
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3 text-[13px] font-medium text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
            >
              Planı yükselt →
            </Link>
          </div>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Yeni kural ekle</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto]">
            <div>
              <Label htmlFor="rule-type">Tür</Label>
              <select
                id="rule-type"
                value={form.ruleType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    ruleType: e.target.value as BlockingRuleType,
                    value: "",
                  }))
                }
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-[14px] text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)]"
              >
                {RULE_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {RULE_META[rt].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="rule-value">Değer</Label>
              <Input
                id="rule-value"
                type="text"
                placeholder={meta.placeholder}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="rule-reason" className="text-[12px]">
                Sebep <span className="text-[var(--color-fg-faint)]">opsiyonel</span>
              </Label>
              <Input
                id="rule-reason"
                type="text"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" loading={submitting} disabled={!form.value.trim()}>
                <Plus size={14} aria-hidden />
                Ekle
              </Button>
            </div>
          </div>
          {meta.hint && (
            <p className="text-[12px] text-[var(--color-fg-muted)]">{meta.hint}</p>
          )}
          {error && <p className="text-[13px] text-[var(--color-danger)]">{error}</p>}
          {success && <p className="text-[13px] text-[var(--color-success)]">{success}</p>}
        </form>
      </Card>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--color-fg-faint)]">Yükleniyor…</p>
        </Card>
      ) : rules.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="Henüz kural yok"
            description="İlk kuralını yukarıdaki formdan ekleyebilirsin."
          />
        </Card>
      ) : (
        grouped.map((group) => (
          <Card key={group.ruleType} className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {RULE_META[group.ruleType].groupTitle}
                <Badge tone="accent">{group.items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <ul className="flex flex-col gap-2">
              {group.items.map((rule) => (
                <li
                  key={rule.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3",
                    !rule.isActive && "opacity-55"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[14px] font-medium text-[var(--color-fg)] tabular-nums">
                        {rule.value}
                      </span>
                      {rule.matchCount > 0 && (
                        <Badge tone="warning">{rule.matchCount} eşleşme</Badge>
                      )}
                    </div>
                    {rule.reason && (
                      <p className="mt-0.5 text-[12px] text-[var(--color-fg-muted)]">
                        {rule.reason}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-[var(--color-fg-faint)]">
                      {rule.lastMatched
                        ? `Son eşleşme: ${relativeTime(rule.lastMatched)}`
                        : "Henüz eşleşme yok"}{" "}
                      · Eklendi:{" "}
                      {new Date(rule.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggle(rule)}
                      className={cn(
                        rule.isActive
                          ? "text-[var(--color-success)]"
                          : "text-[var(--color-fg-muted)]"
                      )}
                    >
                      {rule.isActive ? "Aktif" : "Pasif"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(rule)}
                      aria-label="Sil"
                      className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/[0.08]"
                    >
                      <Trash2 size={14} aria-hidden />
                      Sil
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </>
  );
}
