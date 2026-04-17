'use client';

import { useCallback, useEffect, useState } from 'react';
import { blockedOrders, BlockedOrder, BlockSource } from '@/lib/api';

const SOURCE_STYLE: Record<BlockSource, { label: string; bg: string; color: string; border: string }> = {
  LEGACY_PHONE:       { label: 'Telefon (Eski)',  bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
  LEGACY_POSTAL_CODE: { label: 'Posta (Eski)',    bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
  BLOCKING_RULE:      { label: 'Kural',           bg: 'rgba(139,92,246,0.15)',  color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
  RATE_LIMIT:         { label: 'Limit Aşımı',     bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
};

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16, padding: '24px 28px', marginBottom: 20,
};
const input: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#e5e7eb', fontSize: 14, padding: '10px 14px',
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const LIMIT = 20;

export default function BlockedOrdersTab({ shopId }: { shopId: number }) {
  const [items, setItems] = useState<BlockedOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await blockedOrders.list(shopId, {
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to + 'T23:59:59').toISOString() : undefined,
        page,
        limit: LIMIT,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
    }
    setLoading(false);
  }, [shopId, from, to, page]);

  useEffect(() => { load(); }, [load]);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  function handleClear() {
    setFrom('');
    setTo('');
    setPage(1);
  }

  return (
    <>
      <form onSubmit={handleFilter} style={card}>
        <h3 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Filtrele</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px,1fr) minmax(160px,1fr) auto auto', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6, display: 'block' }}>Başlangıç</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{ ...input, width: '100%', colorScheme: 'dark' }} />
          </div>
          <div>
            <label style={{ color: '#9ca3af', fontSize: 12, marginBottom: 6, display: 'block' }}>Bitiş</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{ ...input, width: '100%', colorScheme: 'dark' }} />
          </div>
          <button type="submit" style={{
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 8,
            color: '#fff', fontWeight: 700, fontSize: 14, padding: '10px 20px',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>Filtrele</button>
          <button type="button" onClick={handleClear} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            color: '#9ca3af', fontWeight: 600, fontSize: 14, padding: '10px 16px',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>Temizle</button>
        </div>
        {error && <p style={{ color: '#f87171', fontSize: 13, margin: '10px 0 0' }}>⚠ {error}</p>}
      </form>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            Bloklanan Siparişler
            <span style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: '#a78bfa' }}>
              {total}
            </span>
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280', fontSize: 14 }}>Yükleniyor…</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <p style={{ color: '#9ca3af', margin: 0, fontSize: 14 }}>Henüz bloklanan sipariş yok.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', margin: '0 -28px', padding: '0 28px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: '#6b7280', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Tarih</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Müşteri</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Telefon</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>IP</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Posta</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Kaynak</th>
                    <th style={{ padding: '10px 12px', fontWeight: 600 }}>Kural</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(o => {
                    const srcStyle = SOURCE_STYLE[o.blockSource];
                    return (
                      <tr key={o.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmtDateTime(o.blockedAt)}</td>
                        <td style={{ padding: '12px', color: '#e5e7eb' }}>{o.customerName ?? '—'}</td>
                        <td style={{ padding: '12px', color: '#e5e7eb', fontFamily: 'ui-monospace, Menlo, monospace' }}>{o.phoneNumber ?? '—'}</td>
                        <td style={{ padding: '12px', color: '#e5e7eb', fontFamily: 'ui-monospace, Menlo, monospace' }}>{o.ipAddress ?? '—'}</td>
                        <td style={{ padding: '12px', color: '#9ca3af' }}>{o.postalCode ?? '—'}</td>
                        <td style={{
                          padding: '12px', color: '#9ca3af',
                          maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }} title={o.email ?? undefined}>
                          {o.email ?? '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: srcStyle.bg, border: `1px solid ${srcStyle.border}`, color: srcStyle.color,
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                          }}>{srcStyle.label}</span>
                        </td>
                        <td style={{ padding: '12px', color: '#6b7280', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11 }}>
                          {o.ruleType}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ color: '#6b7280', fontSize: 13 }}>
                  Sayfa {page} / {totalPages} · Toplam {total}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: page <= 1 ? '#4b5563' : '#e5e7eb', fontSize: 13, padding: '8px 14px',
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    }}>
                    ← Önceki
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      color: page >= totalPages ? '#4b5563' : '#e5e7eb', fontSize: 13, padding: '8px 14px',
                      cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    }}>
                    Sonraki →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
