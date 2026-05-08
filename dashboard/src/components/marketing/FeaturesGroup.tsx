"use client";

import { MessageSquare, Store, ShieldCheck, Check, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeatureSection } from "./FeatureSection";

export function FeaturesGroup() {
  return (
    <div id="how-it-works">
      <FeatureSection
        eyebrow="SMS doğrulama"
        icon={MessageSquare}
        title="Müşteri SMS'i okur, tek tıklamayla onaylar."
        body="Her kapıda ödeme siparişinde müşteriye otomatik SMS gönderilir. Linke tıklayanlar saniyeler içinde onayını verir; vermeyenler kargoya çıkmadan elenir. WhatsApp da Pro planda."
        bullets={[
          "6 haneli OTP destekli iki yol — link veya kod",
          "SMS gönderim saatleri mağaza bazında ayarlanır",
          "WhatsApp + SMS aynı anda Pro ve üzeri planlarda",
        ]}
        visual={<SmsVisual />}
      />

      <FeatureSection
        reverse
        eyebrow="Operasyonel kontrol"
        icon={Store}
        title="Bütün siparişler tek panelde. Apple-pro netlik."
        body="Sipariş geldiği anda durumunu takip et, manuel onayla, SMS yeniden gönder, ön ödeme linki üret. Birden fazla Shopify mağazasını tek hesaptan yönet."
        bullets={[
          "Sınırsız mağaza yönetimi (Business plan)",
          "Sipariş başına aksiyon: onayla / iptal et / SMS gönder",
          "Detaylı SMS log + RTO analizi (Pro)",
        ]}
        visual={<ConsoleVisual />}
      />

      <FeatureSection
        eyebrow="Akıllı engelleme"
        icon={ShieldCheck}
        title="Sahte siparişler senin değil, sistemin sorunu."
        body="IP, telefon deseni, posta kodu, sipariş limiti — birden fazla kuralla şüpheli siparişleri otomatik elemine et. Bloklanan her sipariş tasarruf edilen bir SMS."
        bullets={[
          "IP / IP aralığı, telefon regex, email alan adı kuralları",
          "30 günlük telefon ve IP başına sipariş limiti",
          "Bloklanan siparişler için detaylı analiz",
        ]}
        visual={<BlockingVisual />}
      />
    </div>
  );
}

/* ------------------------- Visual building blocks ------------------------- */

function SmsVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <div
        className="rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-md)]"
        style={{
          boxShadow:
            "0 24px 60px -24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }}
      >
        <p className="mb-3 text-[11px] uppercase tracking-[0.08em] text-[var(--color-fg-muted)]">
          SMS · 21:42
        </p>
        <p className="text-[14px] leading-relaxed text-[var(--color-fg)]">
          Merhaba Ayşe, ₺549,00 tutarındaki siparişini onaylamak için:
          <br />
          <span className="font-mono text-[var(--color-accent)]">
            chekkify.com/c/4xb9
          </span>
          <br />
          Doğrulama kodun:{" "}
          <span className="font-mono font-medium text-[var(--color-fg)]">
            483 219
          </span>
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/[0.08] px-3 py-2 text-[13px] text-[var(--color-success)]">
        <Check size={14} strokeWidth={2.5} aria-hidden />
        Sipariş 12 saniyede onaylandı
      </div>
    </div>
  );
}

function ConsoleVisual() {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="px-5 pt-4">
        <CardTitle>Bekleyen aksiyonlar</CardTitle>
        <Badge tone="warning">3</Badge>
      </CardHeader>
      <ul className="divide-y divide-[var(--color-border)]">
        {[
          { name: "Mehmet Demir", total: "₺ 1.240", action: "SMS gönder" },
          { name: "Selim Kaya", total: "₺ 689", action: "Manuel onayla" },
          { name: "Buse Çetin", total: "₺ 320", action: "Ön ödeme linki" },
        ].map((row) => (
          <li
            key={row.name}
            className="flex items-center justify-between gap-3 px-5 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[var(--color-fg)]">
                {row.name}
              </p>
              <p className="text-[12px] text-[var(--color-fg-muted)] tabular-nums">
                {row.total}
              </p>
            </div>
            <span className="text-[12px] font-medium text-[var(--color-accent)]">
              {row.action}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function BlockingVisual() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Engelleme kuralları</CardTitle>
        <Badge tone="accent">7 aktif</Badge>
      </CardHeader>
      <ul className="space-y-2">
        {[
          { kind: "Telefon deseni", value: "^\\+90555.*", tone: "matched" as const },
          { kind: "IP aralığı", value: "176.236.0.0/16", tone: "matched" as const },
          { kind: "Email alan adı", value: "tempmail.com", tone: "active" as const },
          { kind: "Telefon limiti", value: "30 günde max 3", tone: "active" as const },
        ].map((r) => (
          <li
            key={r.value}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                {r.kind}
              </p>
              <p className="mt-0.5 truncate font-mono text-[13px] text-[var(--color-fg)]">
                {r.value}
              </p>
            </div>
            {r.tone === "matched" ? (
              <Badge tone="warning">eşleşti</Badge>
            ) : (
              <Badge tone="success">aktif</Badge>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent-faded)] px-3 py-2 text-[12px] text-[var(--color-accent)]">
        <X size={14} strokeWidth={2.5} aria-hidden />
        Bu hafta 42 sipariş otomatik bloklandı
      </div>
    </Card>
  );
}
