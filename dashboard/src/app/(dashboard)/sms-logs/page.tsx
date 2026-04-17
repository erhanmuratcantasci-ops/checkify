'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  return document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1] ?? null;
}

type SMSStatus = 'PENDING' | 'SENT' | 'FAILED';

interface SMSLog {
  id: number;
  phone: string;
  message: string;
  status: SMSStatus;
  errorMessage: string | null;
  createdAt: string;
  order: { id: number; customerName: string; customerPhone: string; shop: { name: string } };
}

const STATUS_COLORS: Record<SMSStatus, { bg: string; color: string; label: string }> = {
  SENT:    { bg: 'rgba(5,150,105,0.15)',  color: '#34d399', label: 'Gönderildi' },
  FAILED:  { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', label: 'Başarısız' },
  PENDING: { bg: 'rgba(217,119,6,0.12)',  color: '#fbbf24', label: 'Bekliyor' },
};

export default function SMSLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const limit = 20;

  useEffect(() => {
    const token = getCookie('token');
    if (!token) { router.push('/login'); return; }
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) qs.set('status', status);
    fetch(`${API}/orders/sms-logs?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setLogs(d.logs ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page, status, router]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: 'system-ui, sans-serif' }}>
      <GeometricBackground />
      <Navbar />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>SMS Geçmişi</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Toplam {total} kayıt</p>
        </div>

        {/* Filtreler */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['', 'SENT', 'FAILED', 'PENDING'] as const).map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: status === s ? 'none' : '1px solid rgba(255,255,255,0.1)',
              background: status === s ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.04)',
              color: status === s ? '#fff' : '#9ca3af',
            }}>
              {s === '' ? 'Tümü' : STATUS_COLORS[s].label}
            </button>
          ))}
        </div>

        {/* Tablo */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>Yükleniyor...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <p style={{ margin: 0 }}>Henüz SMS kaydı yok</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Tarih', 'Mağaza', 'Müşteri', 'Telefon', 'Durum', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const sc = STATUS_COLORS[log.status];
                  const isOpen = expanded === log.id;
                  return (
                    <>
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                        onClick={() => setExpanded(isOpen ? null : log.id)}>
                        <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 13 }}>
                          {new Date(log.createdAt).toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#e5e7eb', fontSize: 13 }}>{log.order.shop.name}</td>
                        <td style={{ padding: '12px 16px', color: '#e5e7eb', fontSize: 13 }}>{log.order.customerName}</td>
                        <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 13, fontFamily: 'monospace' }}>{log.phone}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{sc.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 18 }}>{isOpen ? '▲' : '▼'}</td>
                      </tr>
                      {isOpen && (
                        <tr key={log.id + '-detail'} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td colSpan={6} style={{ padding: '12px 16px 16px', background: 'rgba(139,92,246,0.04)' }}>
                            <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Mesaj İçeriği</p>
                            <p style={{ color: '#d1d5db', fontSize: 13, margin: '0 0 8px', lineHeight: 1.6 }}>{log.message}</p>
                            {log.errorMessage && (
                              <>
                                <p style={{ color: '#6b7280', fontSize: 12, margin: '8px 0 4px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Hata</p>
                                <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{log.errorMessage}</p>
                              </>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Sayfalama */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: page === 1 ? '#374151' : '#9ca3af', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13 }}>
              ← Önceki
            </button>
            <span style={{ padding: '8px 16px', color: '#6b7280', fontSize: 13 }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: page === totalPages ? '#374151' : '#9ca3af', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13 }}>
              Sonraki →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
