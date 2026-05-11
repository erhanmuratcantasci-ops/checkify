"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  return document.cookie.split("; ").find((r) => r.startsWith(name + "="))?.split("=")[1] ?? null;
}

type SMSStatus = "PENDING" | "SENT" | "FAILED";

interface SMSLog {
  id: number;
  phone: string;
  message: string;
  status: SMSStatus;
  errorMessage: string | null;
  createdAt: string;
  order: {
    id: number;
    customerName: string;
    customerPhone: string;
    shop: { name: string };
  };
}

const STATUS_LABEL_KEYS: Record<SMSStatus, TranslationKey> = {
  SENT: "orders_sms_status_sent",
  FAILED: "orders_sms_status_failed",
  PENDING: "orders_status_pending_label",
};

const STATUS_TONE: Record<SMSStatus, "success" | "warning" | "danger"> = {
  SENT: "success",
  FAILED: "danger",
  PENDING: "warning",
};

const FILTER_KEYS: { key: SMSStatus | ""; labelKey: TranslationKey }[] = [
  { key: "", labelKey: "orders_all" },
  { key: "SENT", labelKey: "orders_sms_status_sent" },
  { key: "FAILED", labelKey: "orders_sms_status_failed" },
  { key: "PENDING", labelKey: "orders_status_pending_label" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SMSLogsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<SMSStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const limit = 20;

  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) qs.set("status", status);
    fetch(`${API}/orders/sms-logs?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page, status, router]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-8 md:px-10 md:py-10">
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
          {t("smslogs_title")}
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">
          {t("smslogs_total_label")} <span className="tabular-nums">{total}</span>
        </p>
      </header>

      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {FILTER_KEYS.map((f) => {
          const active = status === f.key;
          return (
            <button
              key={f.key || "all"}
              type="button"
              onClick={() => {
                setStatus(f.key as SMSStatus | "");
                setPage(1);
              }}
              className={cn(
                "h-9 whitespace-nowrap rounded-[var(--radius-md)] border px-3 text-[13px] font-medium transition-colors",
                active
                  ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-faded)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)]"
              )}
            >
              {t(f.labelKey)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--color-fg-faint)]">{t("loading")}</p>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <EmptyState icon={Inbox} title={t("smslogs_empty_title")} />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>{t("orders_col_date")}</TH>
                <TH>{t("orders_detail_shop")}</TH>
                <TH>{t("orders_detail_customer")}</TH>
                <TH>{t("orders_detail_phone")}</TH>
                <TH>{t("orders_col_status")}</TH>
                <TH className="w-10" aria-label={t("smslogs_expand_aria")} />
              </TR>
            </THead>
            <TBody>
              {logs.map((log) => {
                const isOpen = expanded === log.id;
                return (
                  <Fragment key={log.id}>
                    <TR
                      onClick={() => setExpanded(isOpen ? null : log.id)}
                      className="cursor-pointer"
                    >
                      <TD className="text-[var(--color-fg-muted)] tabular-nums">
                        {formatDate(log.createdAt)}
                      </TD>
                      <TD>{log.order.shop.name}</TD>
                      <TD>{log.order.customerName}</TD>
                      <TD className="font-mono text-[var(--color-fg-muted)] tabular-nums">
                        {log.phone}
                      </TD>
                      <TD>
                        <Badge tone={STATUS_TONE[log.status]}>
                          {t(STATUS_LABEL_KEYS[log.status])}
                        </Badge>
                      </TD>
                      <TD className="text-[var(--color-fg-muted)]">
                        {isOpen ? (
                          <ChevronUp size={16} aria-hidden />
                        ) : (
                          <ChevronDown size={16} aria-hidden />
                        )}
                      </TD>
                    </TR>
                    {isOpen && (
                      <TR className="hover:bg-transparent">
                        <TD colSpan={6} className="bg-[var(--color-bg-overlay)]">
                          <p className="mb-1 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                            {t("smslogs_message_label")}
                          </p>
                          <p className="mb-3 text-[13px] leading-relaxed text-[var(--color-fg)]">
                            {log.message}
                          </p>
                          {log.errorMessage && (
                            <>
                              <p className="mb-1 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                                {t("orders_sms_error_label")}
                              </p>
                              <p className="text-[13px] text-[var(--color-danger)]">
                                {log.errorMessage}
                              </p>
                            </>
                          )}
                        </TD>
                      </TR>
                    )}
                  </Fragment>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("pagination_prev")}
          </Button>
          <span className="px-3 text-[13px] text-[var(--color-fg-muted)] tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("pagination_next")}
          </Button>
        </div>
      )}
    </div>
  );
}
