"use client";

import { useCallback, useEffect, useState } from "react";
import { blockingSettings, BlockingSettings } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEFAULT_PHONE_LIMIT = 3;
const DEFAULT_IP_LIMIT = 5;

function formEqualsSettings(a: BlockingSettings, b: BlockingSettings): boolean {
  return (
    a.advancedBlockingEnabled === b.advancedBlockingEnabled &&
    a.maxOrdersPerPhone30d === b.maxOrdersPerPhone30d &&
    a.maxOrdersPerIp30d === b.maxOrdersPerIp30d
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        value ? "bg-[var(--color-accent)]" : "bg-[var(--color-border-strong)]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          value && "translate-x-5"
        )}
      />
    </button>
  );
}

function RateLimitRow({
  title,
  description,
  value,
  defaultOn,
  onChange,
}: {
  title: string;
  description: string;
  value: number | null;
  defaultOn: number;
  onChange: (v: number | null) => void;
}) {
  const active = value !== null;
  return (
    <div>
      <p className="mb-2 text-[14px] font-medium text-[var(--color-fg)]">{title}</p>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Input
          type="number"
          min={1}
          max={1000}
          disabled={!active}
          value={active ? String(value) : ""}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (Number.isFinite(n) && n >= 1 && n <= 1000) onChange(n);
            else if (e.target.value === "") onChange(null);
          }}
          placeholder={String(defaultOn)}
          className={cn("w-32", !active && "opacity-50")}
        />
        <div className="inline-flex gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1">
          <button
            type="button"
            onClick={() => onChange(value ?? defaultOn)}
            className={cn(
              "h-8 rounded-[calc(var(--radius-md)-2px)] px-3 text-[12px] font-medium transition-colors",
              active
                ? "bg-[var(--color-success)]/[0.16] text-[var(--color-success)]"
                : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)]"
            )}
          >
            Aktif
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn(
              "h-8 rounded-[calc(var(--radius-md)-2px)] px-3 text-[12px] font-medium transition-colors",
              !active
                ? "bg-[var(--color-surface)] text-[var(--color-fg)]"
                : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)]"
            )}
          >
            Kapalı
          </button>
        </div>
      </div>
      <p className="text-[12px] leading-relaxed text-[var(--color-fg-muted)]">{description}</p>
    </div>
  );
}

export default function SettingsTab({ shopId }: { shopId: number }) {
  const [settings, setSettings] = useState<BlockingSettings | null>(null);
  const [form, setForm] = useState<BlockingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await blockingSettings.get(shopId);
      setSettings(res);
      setForm(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ayarlar yüklenemedi");
    }
    setLoading(false);
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!form || !settings) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await blockingSettings.update({ shopId, ...form });
      setSettings(res.settings);
      setForm(res.settings);
      setSuccess("Ayarlar kaydedildi.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <Card>
        <p className="text-[14px] text-[var(--color-fg-faint)]">Yükleniyor…</p>
      </Card>
    );
  }
  if (!form || !settings) {
    return (
      <Card>
        <p className="text-[14px] text-[var(--color-danger)]">
          {error ?? "Ayarlar yüklenemedi"}
        </p>
      </Card>
    );
  }

  const hasChanges = !formEqualsSettings(form, settings);

  return (
    <>
      <Card className="mb-4">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p
              className="text-[var(--color-fg)]"
              style={{
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: "var(--tracking-heading)",
              }}
            >
              Gelişmiş engelleme aktif
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
              Kural bazlı (IP, regex, email, isim) ve sipariş limit engelleme sistemini
              aç/kapat. Kapatırsan eski telefon/posta kodu engel listeleri yine çalışır.
            </p>
          </div>
          <Toggle
            value={form.advancedBlockingEnabled}
            onChange={(v) => setForm((f) => (f ? { ...f, advancedBlockingEnabled: v } : f))}
          />
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Sipariş limitleri</CardTitle>
        </CardHeader>
        <RateLimitRow
          title="Telefon başına 30 günlük limit"
          description="Aynı telefondan 30 gün içinde bu sayıyı aşan siparişler otomatik bloklanır."
          value={form.maxOrdersPerPhone30d}
          defaultOn={DEFAULT_PHONE_LIMIT}
          onChange={(v) => setForm((f) => (f ? { ...f, maxOrdersPerPhone30d: v } : f))}
        />
        <div className="my-5 h-px bg-[var(--color-border)]" />
        <RateLimitRow
          title="IP başına 30 günlük limit"
          description="Aynı IP adresinden 30 gün içinde bu sayıyı aşan siparişler otomatik bloklanır."
          value={form.maxOrdersPerIp30d}
          defaultOn={DEFAULT_IP_LIMIT}
          onChange={(v) => setForm((f) => (f ? { ...f, maxOrdersPerIp30d: v } : f))}
        />
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          size="md"
          loading={saving}
          disabled={!hasChanges || saving}
          onClick={handleSave}
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </Button>
        {hasChanges && !saving && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-warning)]">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full bg-[var(--color-warning)]"
            />
            Kaydedilmemiş değişiklik var
          </span>
        )}
        {success && (
          <span className="text-[13px] text-[var(--color-success)]">{success}</span>
        )}
        {error && <span className="text-[13px] text-[var(--color-danger)]">{error}</span>}
      </div>
    </>
  );
}
