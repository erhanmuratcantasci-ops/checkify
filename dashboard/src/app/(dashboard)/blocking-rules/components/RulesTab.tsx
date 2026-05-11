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
import { useTranslation, type TranslationKey } from "@/lib/i18n";
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

const RULE_META_KEYS: Record<
  BlockingRuleType,
  { labelKey: TranslationKey; placeholder: string; groupKey: TranslationKey; hintKey?: TranslationKey }
> = {
  IP_ADDRESS: {
    labelKey: "blocking_ruletype_ip_address",
    placeholder: "192.168.1.100",
    groupKey: "blocking_rule_group_ip_address",
  },
  IP_RANGE: {
    labelKey: "blocking_ruletype_ip_range",
    placeholder: "192.168.1.0/24",
    groupKey: "blocking_rule_group_ip_range",
    hintKey: "blocking_rule_hint_ip_range",
  },
  PHONE_PATTERN: {
    labelKey: "blocking_ruletype_phone_pattern_full",
    placeholder: "^\\+905551.*",
    groupKey: "blocking_rule_group_phone_pattern",
    hintKey: "blocking_rule_hint_phone_pattern",
  },
  EMAIL_DOMAIN: {
    labelKey: "blocking_ruletype_email_domain",
    placeholder: "tempmail.com",
    groupKey: "blocking_rule_group_email_domain",
  },
  CUSTOMER_NAME: {
    labelKey: "blocking_ruletype_customer_name_match",
    placeholder: "Ahmet",
    groupKey: "blocking_rule_group_customer_name",
  },
  MAX_ORDERS_PER_PHONE: {
    labelKey: "blocking_ruletype_max_per_phone",
    placeholder: "3",
    groupKey: "blocking_rule_group_max_per_phone",
    hintKey: "blocking_rule_hint_max_orders",
  },
  MAX_ORDERS_PER_IP: {
    labelKey: "blocking_ruletype_max_per_ip",
    placeholder: "5",
    groupKey: "blocking_rule_group_max_per_ip",
    hintKey: "blocking_rule_hint_max_orders",
  },
};

function useRelativeTime() {
  const { t } = useTranslation();
  return (iso: string | null): string => {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t("time_just_now");
    if (minutes < 60) return t("time_min_ago").replace("{n}", String(minutes));
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("time_hour_ago").replace("{n}", String(hours));
    const days = Math.floor(hours / 24);
    return t("time_day_ago").replace("{n}", String(days));
  };
}

export default function RulesTab({ shopId }: { shopId: number }) {
  const { t } = useTranslation();
  const relativeTime = useRelativeTime();
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
      setError(err instanceof Error ? err.message : t("blocking_rules_load_error"));
    }
    setLoading(false);
  }, [shopId, t]);

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
      setSuccess(t("blocking_rule_added"));
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
        setError(err instanceof Error ? err.message : t("blocking_rule_add_error"));
      }
    }
    setSubmitting(false);
  }

  async function handleDelete(rule: BlockingRule) {
    const ok = window.confirm(t("blocking_rule_delete_confirm").replace("{rule}", rule.value));
    if (!ok) return;
    const prev = rules;
    setRules((r) => r.filter((x) => x.id !== rule.id));
    try {
      await blockingRules.delete(rule.id, shopId);
    } catch (err) {
      setRules(prev);
      setError(err instanceof Error ? err.message : t("blocking_rule_delete_error"));
    }
  }

  async function handleToggle(rule: BlockingRule) {
    const prev = rules;
    setRules((r) => r.map((x) => (x.id === rule.id ? { ...x, isActive: !x.isActive } : x)));
    try {
      await blockingRules.toggle(rule.id, shopId);
    } catch (err) {
      setRules(prev);
      setError(err instanceof Error ? err.message : t("blocking_rule_status_update_error"));
    }
  }

  const grouped = RULE_TYPES.map((rt) => ({
    ruleType: rt,
    items: rules.filter((r) => r.ruleType === rt),
  })).filter((g) => g.items.length > 0);

  const meta = RULE_META_KEYS[form.ruleType];

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
                  ? t("blocking_plan_error_starter")
                  : t("blocking_plan_error_pro")}
              </p>
              <p className="mt-1 text-[13px] text-[var(--color-fg-muted)]">
                {planError.feature === "rate_limit_blocking"
                  ? t("blocking_plan_desc_starter")
                  : t("blocking_plan_desc_pro")}
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3 text-[13px] font-medium text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
            >
              {t("blocking_upgrade_plan")}
            </Link>
          </div>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t("blocking_rules_add_title")}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto]">
            <div>
              <Label htmlFor="rule-type">{t("blocking_rule_type_label")}</Label>
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
                    {t(RULE_META_KEYS[rt].labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="rule-value">{t("blocking_rule_value_label")}</Label>
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
                {t("blocking_rule_reason_label")} <span className="text-[var(--color-fg-faint)]">{t("blocking_optional")}</span>
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
                {t("blocking_rule_add_btn")}
              </Button>
            </div>
          </div>
          {meta.hintKey && (
            <p className="text-[12px] text-[var(--color-fg-muted)]">{t(meta.hintKey)}</p>
          )}
          {error && <p className="text-[13px] text-[var(--color-danger)]">{error}</p>}
          {success && <p className="text-[13px] text-[var(--color-success)]">{success}</p>}
        </form>
      </Card>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--color-fg-faint)]">{t("loading")}</p>
        </Card>
      ) : rules.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title={t("blocking_rules_empty_title")}
            description={t("blocking_rules_empty_desc")}
          />
        </Card>
      ) : (
        grouped.map((group) => (
          <Card key={group.ruleType} className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {t(RULE_META_KEYS[group.ruleType].groupKey)}
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
                        <Badge tone="warning">{t("blocking_rule_matches").replace("{n}", String(rule.matchCount))}</Badge>
                      )}
                    </div>
                    {rule.reason && (
                      <p className="mt-0.5 text-[12px] text-[var(--color-fg-muted)]">
                        {rule.reason}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-[var(--color-fg-faint)]">
                      {rule.lastMatched
                        ? t("blocking_rule_last_matched").replace("{time}", relativeTime(rule.lastMatched))
                        : t("blocking_rule_no_matches")}{" "}
                      · {t("blocking_rule_created_date").replace("{date}", new Date(rule.createdAt).toLocaleDateString("tr-TR"))}
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
                      {rule.isActive ? t("blocking_rule_active") : t("blocking_rule_inactive")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(rule)}
                      aria-label={t("blocking_rule_delete_aria")}
                      className="text-[var(--color-danger)] hover:bg-[var(--color-danger)]/[0.08]"
                    >
                      <Trash2 size={14} aria-hidden />
                      {t("delete")}
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
