"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
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

const STATUS_LABEL: Record<SMSStatus, string> = {
  SENT: "Gönderildi",
  FAILED: "Başarısız",
  PENDING: "Bekliyor",
};

const STATUS_TONE: Record<SMSStatus, "success" | "warning" | "danger"> = {
  SENT: "success",
  FAILED: "danger",
  PENDING: "warning",
};

const FILTERS: { key: ""; label: string }[] | { key: SMSStatus | ""; label: string }[] = [
  { key: "", label: "Tümü" },
  { key: "SENT", label: "Gönderildi" },
  { key: "FAILED", label: "Başarısız" },
  { key: "PENDING", label: "Bekliyor" },
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
          SMS geçmişi
        </h1>
        <p className="mt-1 text-[14px] text-[var(--color-fg-muted)]">
          Toplam <span className="tabular-nums">{total}</span> kayıt
        </p>
      </header>

      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
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
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--color-fg-faint)]">Yükleniyor…</p>
        </Card>
      ) : logs.length === 0 ? (
        <Card>
          <EmptyState icon={Inbox} title="Henüz SMS kaydı yok" />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Tarih</TH>
                <TH>Mağaza</TH>
                <TH>Müşteri</TH>
                <TH>Telefon</TH>
                <TH>Durum</TH>
                <TH className="w-10" aria-label="Genişlet" />
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
                          {STATUS_LABEL[log.status]}
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
                            Mesaj içeriği
                          </p>
                          <p className="mb-3 text-[13px] leading-relaxed text-[var(--color-fg)]">
                            {log.message}
                          </p>
                          {log.errorMessage && (
                            <>
                              <p className="mb-1 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                                Hata
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
            Önceki
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
            Sonraki
          </Button>
        </div>
      )}
    </div>
  );
}
