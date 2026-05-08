"use client";

import { motion } from "framer-motion";
import { Inbox, Package, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Badge } from "@/components/ui/badge";
import { easeOut } from "@/lib/motion";

/**
 * Static "live preview" of the merchant dashboard, built from the real M2
 * primitives so what marketing visitors see matches what they'll actually
 * use. Tilted in 3D space for an Apple-keynote hero feel; pointer-events
 * disabled so it can't trap clicks.
 */
export function HeroDashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 4 }}
      transition={{ duration: 0.55, ease: easeOut, delay: 0.12 }}
      className="pointer-events-none mx-auto w-full max-w-[860px]"
      style={{
        perspective: 1600,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]/95 p-5 backdrop-blur-xl md:p-7"
        style={{
          boxShadow:
            "0 40px 80px -32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 -1px 0 rgba(251,113,133,0.18) inset",
        }}
      >
        {/* Faux window chrome */}
        <div className="mb-5 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-fg-faint)]/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-fg-faint)]/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-fg-faint)]/20" />
          <span className="ml-3 text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
            Genel bakış
          </span>
        </div>

        {/* Metrics row */}
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard
            label="Bugünkü ciro"
            value="₺ 12.480"
            hint="24 sipariş"
          />
          <MetricCard
            label="Onaylanan"
            value="187"
            delta="%93"
            deltaTone="success"
          />
          <MetricCard
            label="Bekleyen"
            value="14"
            delta="aksiyon"
            deltaTone="warning"
          />
          <MetricCard
            label="İptal oranı"
            value="%6"
            deltaTone="success"
          />
        </div>

        {/* Recent orders preview */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <span className="text-[13px] font-medium text-[var(--color-fg)]">
              Son siparişler
            </span>
            <span className="inline-flex items-center gap-1 text-[12px] text-[var(--color-accent)]">
              Hepsini gör <ArrowRight size={12} aria-hidden />
            </span>
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {MOCK_ORDERS.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--color-fg)]">
                    {o.name}
                  </p>
                  <p className="text-[11px] text-[var(--color-fg-muted)] tabular-nums">
                    {o.phone} · {o.time}
                  </p>
                </div>
                <span className="text-[13px] font-medium tabular-nums text-[var(--color-fg)]">
                  {o.total}
                </span>
                <Badge tone={o.tone}>{o.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        {/* Bottom shop summary tile */}
        <div className="mt-3 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)]">
            <Package size={14} aria-hidden className="text-[var(--color-fg-muted)]" />
            <span>3 mağaza bağlı</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[12px] text-[var(--color-fg-muted)]">
            <Inbox size={14} aria-hidden />
            14 yeni
          </span>
        </div>
      </div>
    </motion.div>
  );
}

const MOCK_ORDERS: {
  id: number;
  name: string;
  phone: string;
  total: string;
  status: string;
  tone: "success" | "warning" | "info";
  time: string;
}[] = [
  {
    id: 1,
    name: "Ayşe Yılmaz",
    phone: "+90 5•• ••• 47 12",
    total: "₺ 549",
    status: "Onaylandı",
    tone: "success",
    time: "12 dk önce",
  },
  {
    id: 2,
    name: "Mehmet Demir",
    phone: "+90 5•• ••• 03 88",
    total: "₺ 1.240",
    status: "Bekliyor",
    tone: "warning",
    time: "27 dk önce",
  },
  {
    id: 3,
    name: "Zeynep Aksoy",
    phone: "+90 5•• ••• 91 24",
    total: "₺ 320",
    status: "Hazırlanıyor",
    tone: "info",
    time: "1 saat önce",
  },
];
