'use client';

import { useCallback, useEffect, useState } from 'react';
import { blockingSettings, BlockingSettings } from '@/lib/api';

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
  padding: '24px 28px',
  marginBottom: 20,
};
const input: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e5e7eb',
  fontSize: 14,
  padding: '10px 14px',
  width: 120,
};

const DEFAULT_PHONE_LIMIT = 3;
const DEFAULT_IP_LIMIT = 5;

function formEqualsSettings(a: BlockingSettings, b: BlockingSettings): boolean {
  return (
    a.advancedBlockingEnabled === b.advancedBlockingEnabled
    && a.maxOrdersPerPhone30d === b.maxOrdersPerPhone30d
    && a.maxOrdersPerIp30d === b.maxOrdersPerIp30d
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
      setError(err instanceof Error ? err.message : 'Ayarlar yüklenemedi');
    }
    setLoading(false);
  }, [shopId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!form || !settings) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await blockingSettings.update({ shopId, ...form });
      setSettings(res.settings);
      setForm(res.settings);
      setSuccess('Ayarlar kaydedildi.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Yükleniyor…</p>
      </div>
    );
  }
  if (!form || !settings) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ color: '#f87171', fontSize: 14, margin: 0 }}>⚠ {error ?? 'Ayarlar yüklenemedi'}</p>
      </div>
    );
  }

  const hasChanges = !formEqualsSettings(form, settings);

  return (
    <>
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>Gelişmiş Engelleme Aktif</h3>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              Kural bazlı (IP, regex, email, isim) ve sipariş limit engelleme sistemini aç/kapat. Kapatırsan
              eski telefon/posta kodu engel listeleri yine çalışır.
            </p>
          </div>
          <Toggle
            value={form.advancedBlockingEnabled}
            onChange={(v) => setForm((f) => f ? { ...f, advancedBlockingEnabled: v } : f)}
          />
        </div>
      </div>

      <div style={card}>
        <h3 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: '0 0 20px' }}>Sipariş Limitleri</h3>

        <RateLimitRow
          title="Telefon Başına 30 Günlük Limit"
          description="Aynı telefondan 30 gün içinde bu sayıyı aşan siparişler otomatik bloklanır."
          value={form.maxOrdersPerPhone30d}
          defaultOn={DEFAULT_PHONE_LIMIT}
          onChange={(v) => setForm((f) => f ? { ...f, maxOrdersPerPhone30d: v } : f)}
        />

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

        <RateLimitRow
          title="IP Başına 30 Günlük Limit"
          description="Aynı IP adresinden 30 gün içinde bu sayıyı aşan siparişler otomatik bloklanır."
          value={form.maxOrdersPerIp30d}
          defaultOn={DEFAULT_IP_LIMIT}
          onChange={(v) => setForm((f) => f ? { ...f, maxOrdersPerIp30d: v } : f)}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button onClick={handleSave} disabled={!hasChanges || saving}
          style={{
            background: (!hasChanges || saving) ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
            border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14,
            padding: '12px 28px',
            cursor: (!hasChanges || saving) ? 'not-allowed' : 'pointer',
          }}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        {hasChanges && !saving && (
          <span style={{ color: '#fbbf24', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
            Kaydedilmemiş değişiklik var
          </span>
        )}
        {success && <span style={{ color: '#34d399', fontSize: 13 }}>✓ {success}</span>}
        {error && <span style={{ color: '#f87171', fontSize: 13 }}>⚠ {error}</span>}
      </div>
    </>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      aria-pressed={value}
      style={{
        position: 'relative', width: 48, height: 24, borderRadius: 999,
        background: value ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.08)',
        border: value ? 'none' : '1px solid rgba(255,255,255,0.12)',
        cursor: 'pointer', padding: 0, flexShrink: 0,
        transition: 'background 0.2s',
      }}>
      <span style={{
        position: 'absolute', top: value ? 3 : 2, left: value ? 26 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s, top 0.2s',
      }} />
    </button>
  );
}

function RateLimitRow({
  title, description, value, defaultOn, onChange,
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
      <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <input
          type="number"
          min={1}
          max={1000}
          disabled={!active}
          value={active ? String(value) : ''}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (Number.isFinite(n) && n >= 1 && n <= 1000) onChange(n);
            else if (e.target.value === '') onChange(null);
          }}
          placeholder={String(defaultOn)}
          style={{ ...input, opacity: active ? 1 : 0.5 }}
        />
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 4 }}>
          <button type="button" onClick={() => onChange(value ?? defaultOn)}
            style={{
              padding: '6px 12px', borderRadius: 6, border: 'none',
              background: active ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: active ? '#34d399' : '#6b7280',
              fontWeight: active ? 700 : 500, fontSize: 12,
              cursor: 'pointer',
            }}>
            ✓ Aktif
          </button>
          <button type="button" onClick={() => onChange(null)}
            style={{
              padding: '6px 12px', borderRadius: 6, border: 'none',
              background: !active ? 'rgba(107,114,128,0.2)' : 'transparent',
              color: !active ? '#9ca3af' : '#6b7280',
              fontWeight: !active ? 700 : 500, fontSize: 12,
              cursor: 'pointer',
            }}>
            ✗ Kapalı
          </button>
        </div>
      </div>
      <p style={{ color: '#9ca3af', margin: 0, fontSize: 12, lineHeight: 1.5 }}>{description}</p>
    </div>
  );
}
