"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { blockedOrders, BlockedOrder, BlockSource } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation, type TranslationKey } from "@/lib/i18n";

const SOURCE_TONE: Record<BlockSource, "neutral" | "accent" | "warning"> = {
  LEGACY_PHONE: "neutral",
  LEGACY_POSTAL_CODE: "neutral",
  BLOCKING_RULE: "accent",
  RATE_LIMIT: "warning",
};

const SOURCE_LABEL_KEYS: Record<BlockSource, TranslationKey> = {
  LEGACY_PHONE: "blocking_stats_source_legacy_phone_short",
  LEGACY_POSTAL_CODE: "blocking_stats_orders_source_postal_short",
  BLOCKING_RULE: "blocking_stats_source_rule_short",
  RATE_LIMIT: "blocking_stats_source_rate_limit_short",
};

const LIMIT = 20;

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BlockedOrdersTab({ shopId }: { shopId: number }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<BlockedOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await blockedOrders.list(shopId, {
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to + "T23:59:59").toISOString() : undefined,
        page,
        limit: LIMIT,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("blocking_data_load_error"));
    }
    setLoading(false);
  }, [shopId, from, to, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  function handleClear() {
    setFrom("");
    setTo("");
    setPage(1);
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t("blocking_orders_filter_title")}</CardTitle>
        </CardHeader>
        <form onSubmit={handleFilter} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_auto_auto]">
            <div>
              <Label htmlFor="from">{t("blocking_orders_from_label")}</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div>
              <Label htmlFor="to">{t("blocking_orders_to_label")}</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit">{t("blocking_orders_filter_button")}</Button>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="secondary" onClick={handleClear}>
                {t("blocking_orders_clear_filter")}
              </Button>
            </div>
          </div>
          {error && <p className="text-[13px] text-[var(--color-danger)]">{error}</p>}
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <CardHeader className="px-6 pt-5">
          <CardTitle className="flex items-center gap-2">
            {t("blocking_orders_title")}
            <Badge tone="accent">{total}</Badge>
          </CardTitle>
        </CardHeader>
        {loading ? (
          <div className="px-6 pb-6 text-[13px] text-[var(--color-fg-faint)]">{t("loading")}</div>
        ) : items.length === 0 ? (
          <EmptyState icon={ShieldCheck} title={t("blocking_orders_empty_title")} />
        ) : (
          <>
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>{t("orders_col_date")}</TH>
                  <TH>{t("orders_detail_customer")}</TH>
                  <TH>{t("orders_detail_phone")}</TH>
                  <TH>{t("blocking_orders_col_ip")}</TH>
                  <TH>{t("blocking_orders_col_postal")}</TH>
                  <TH>{t("blocking_orders_col_email")}</TH>
                  <TH>{t("blocking_orders_col_source")}</TH>
                  <TH>{t("blocking_orders_col_rule")}</TH>
                </TR>
              </THead>
              <TBody>
                {items.map((o) => (
                  <TR key={o.id}>
                    <TD className="whitespace-nowrap text-[var(--color-fg-muted)] tabular-nums">
                      {fmtDateTime(o.blockedAt)}
                    </TD>
                    <TD>{o.customerName ?? "—"}</TD>
                    <TD className="font-mono text-[var(--color-fg)] tabular-nums">
                      {o.phoneNumber ?? "—"}
                    </TD>
                    <TD className="font-mono text-[var(--color-fg)] tabular-nums">
                      {o.ipAddress ?? "—"}
                    </TD>
                    <TD className="text-[var(--color-fg-muted)]">{o.postalCode ?? "—"}</TD>
                    <TD
                      className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-[var(--color-fg-muted)]"
                      title={o.email ?? undefined}
                    >
                      {o.email ?? "—"}
                    </TD>
                    <TD>
                      <Badge tone={SOURCE_TONE[o.blockSource]}>
                        {t(SOURCE_LABEL_KEYS[o.blockSource])}
                      </Badge>
                    </TD>
                    <TD className="font-mono text-[11px] text-[var(--color-fg-faint)]">
                      {o.ruleType}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-3">
                <p className="text-[13px] text-[var(--color-fg-muted)] tabular-nums">
                  {t("blocking_pagination_label")
                    .replace("{page}", String(page))
                    .replace("{totalPages}", String(totalPages))
                    .replace("{total}", String(total))}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {t("pagination_prev")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    {t("pagination_next")}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}
