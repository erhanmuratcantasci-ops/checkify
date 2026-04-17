'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ApiError,
  blockingRules,
  BlockingRule,
  BlockingRuleType,
} from '@/lib/api';

type FormState = {
  ruleType: BlockingRuleType;
  value: string;
  reason: string;
};

const RULE_TYPES: BlockingRuleType[] = [
  'IP_ADDRESS',
  'IP_RANGE',
  'PHONE_PATTERN',
  'EMAIL_DOMAIN',
  'CUSTOMER_NAME',
  'MAX_ORDERS_PER_PHONE',
  'MAX_ORDERS_PER_IP',
];

const RULE_META: Record<BlockingRuleType, { label: string; placeholder: string; groupTitle: string; hint?: string }> = {
  IP_ADDRESS:           { label: 'IP Adresi',                      placeholder: '192.168.1.100',    groupTitle: 'IP Adresi Kuralları' },
  IP_RANGE:             { label: 'IP Aralığı (CIDR)',              placeholder: '192.168.1.0/24',   groupTitle: 'IP Aralığı Kuralları', hint: 'IPv4 CIDR formatı (ör. 10.0.0.0/8)' },
  PHONE_PATTERN:        { label: 'Telefon Deseni (Regex)',         placeholder: '^\\+905551.*',     groupTitle: 'Telefon Desen Kuralları', hint: 'JavaScript regex deseni' },
  EMAIL_DOMAIN:         { label: 'Email Alan Adı',                 placeholder: 'tempmail.com',     groupTitle: 'Email Alan Adı Kuralları' },
  CUSTOMER_NAME:        { label: 'Müşteri Adı (içeren)',           placeholder: 'Ahmet',            groupTitle: 'Müşteri Adı Kuralları' },
  MAX_ORDERS_PER_PHONE: { label: 'Telefon Başına Sipariş Limiti',  placeholder: '3',                groupTitle: 'Telefon Başına Limit', hint: '30 gün içinde izin verilen maksimum sipariş' },
  MAX_ORDERS_PER_IP:    { label: 'IP Başına Sipariş Limiti',       placeholder: '5',                groupTitle: 'IP Başına Limit', hint: '30 gün içinde izin verilen maksimum sipariş' },
};

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'az önce';
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ay önce`;
  return `${Math.floor(months / 12)} yıl önce`;
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16, padding: '24px 28px', marginBottom: 20,
};
const input: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#e5e7eb', fontSize: 14, padding: '10px 14px',
};

export default function RulesTab({ shopId }: { shopId: number }) {
  const [rules, setRules] = useState<BlockingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [planError, setPlanError] = useState<{ feature: string } | null>(null);
  const [form, setForm] = useState<FormState>({ ruleType: 'IP_ADDRESS', value: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blockingRules.list(shopId);
      setRules(res.rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kurallar yüklenemedi');
    }
    setLoading(false);
  }, [shopId]);

  useEffect(() => { load(); }, [load]);

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
      setForm({ ruleType: form.ruleType, value: '', reason: '' });
      setSuccess('Kural eklendi.');
      setTimeout(() => setSuccess(null), 3000);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && err.body['upgrade']) {
        const feature = typeof err.body['requiredFeature'] === 'string' ? err.body['requiredFeature'] : 'advanced_blocking';
        setPlanError({ feature });
      } else {
        setError(err instanceof Error ? err.message : 'Kural eklenemedi');
      }
    }
    setSubmitting(false);
  }

  async function handleDelete(rule: BlockingRule) {
    const ok = window.confirm(`"${rule.value}" kuralını silmek istediğinize emin misiniz?`);
    if (!ok) return;
    const prev = rules;
    setRules(r => r.filter(x => x.id !== rule.id));
    try {
      await blockingRules.delete(rule.id, shopId);
    } catch (err) {
      setRules(prev);
      setError(err instanceof Error ? err.message : 'Kural silinemedi');
    }
  }

  async function handleToggle(rule: BlockingRule) {
    const prev = rules;
    setRules(r => r.map(x => x.id === rule.id ? { ...x, isActive: !x.isActive } : x));
    try {
      await blockingRules.toggle(rule.id, shopId);
    } catch (err) {
      setRules(prev);
      setError(err instanceof Error ? err.message : 'Durum güncellenemedi');
    }
  }

  const grouped = RULE_TYPES.map(rt => ({
    ruleType: rt,
    items: rules.filter(r => r.ruleType === rt),
  })).filter(g => g.items.length > 0);

  const meta = RULE_META[form.ruleType];

  return (
    <>
      {planError && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#f87171', fontWeight: 700, margin: '0 0 2px', fontSize: 14 }}>
              {planError.feature === 'rate_limit_blocking' ? 'Starter Plan Gerekli' : 'Pro Plan Gerekli'}
            </p>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: 13 }}>
              {planError.feature === 'rate_limit_blocking'
                ? 'Sipariş limit kuralları Starter ve üzeri planlarda kullanılabilir.'
                : 'Bu kural türü Pro ve üzeri planlarda kullanılabilir.'}
            </p>
          </div>
          <Link href="/pricing" style={{
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff',
            fontSize: 13, fontWeight: 700, padding: '8px 14px', borderRadius: 8,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>Planı Yükselt →</Link>
        </div>
      )}

      <form onSubmit={handleSubmit} style={card}>
        <h3 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Yeni Kural Ekle</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(180px, 1fr) minmax(180px, 1fr) auto', gap: 10, alignItems: 'start' }}>
          <select value={form.ruleType}
            onChange={e => setForm(f => ({ ...f, ruleType: e.target.value as BlockingRuleType, value: '' }))}
            style={input}>
            {RULE_TYPES.map(rt => <option key={rt} value={rt}>{RULE_META[rt].label}</option>)}
          </select>

          <input type="text" placeholder={meta.placeholder} value={form.value}
            onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            style={input} />

          <input type="text" placeholder="Sebep (opsiyonel)" value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            style={input} />

          <button type="submit" disabled={submitting || !form.value.trim()}
            style={{
              background: submitting || !form.value.trim() ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
              border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700,
              fontSize: 14, padding: '10px 20px',
              cursor: submitting || !form.value.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}>
            {submitting ? '…' : '+ Ekle'}
          </button>
        </div>
        {meta.hint && <p style={{ color: '#6b7280', fontSize: 12, margin: '8px 0 0' }}>💡 {meta.hint}</p>}
        {error && <p style={{ color: '#f87171', fontSize: 13, margin: '10px 0 0' }}>⚠ {error}</p>}
        {success && <p style={{ color: '#34d399', fontSize: 13, margin: '10px 0 0' }}>✓ {success}</p>}
      </form>

      {loading ? (
        <div style={{ ...card, textAlign: 'center', padding: '32px 0' }}>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Yükleniyor…</p>
        </div>
      ) : rules.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <p style={{ color: '#9ca3af', margin: 0, fontSize: 14 }}>Henüz kural yok. İlk kuralınızı yukarıdan ekleyin.</p>
        </div>
      ) : (
        grouped.map(group => (
          <div key={group.ruleType} style={card}>
            <h3 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              {RULE_META[group.ruleType].groupTitle}
              <span style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: '#a78bfa' }}>
                {group.items.length}
              </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.items.map(rule => (
                <div key={rule.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12,
                  background: rule.isActive ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '12px 16px',
                  opacity: rule.isActive ? 1 : 0.55,
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 14, fontFamily: 'ui-monospace, Menlo, monospace' }}>
                        {rule.value}
                      </span>
                      {rule.matchCount > 0 && (
                        <span style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                          {rule.matchCount} eşleşme
                        </span>
                      )}
                    </div>
                    {rule.reason && <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{rule.reason}</div>}
                    <div style={{ color: '#4b5563', fontSize: 11, marginTop: 2 }}>
                      {rule.lastMatched ? `Son eşleşme: ${relativeTime(rule.lastMatched)}` : 'Henüz eşleşme yok'} · Eklendi: {new Date(rule.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleToggle(rule)}
                      style={{
                        background: rule.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                        border: `1px solid ${rule.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.3)'}`,
                        color: rule.isActive ? '#34d399' : '#9ca3af',
                        fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                      }}>
                      {rule.isActive ? 'Aktif' : 'Pasif'}
                    </button>
                    <button onClick={() => handleDelete(rule)}
                      style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                      }}>
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
