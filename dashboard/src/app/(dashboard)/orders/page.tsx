'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import { SkeletonTable } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslation } from '@/lib/i18n';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: 'rgba(217,119,6,0.15)',  color: '#fbbf24' },
  CONFIRMED: { bg: 'rgba(5,150,105,0.15)',  color: '#34d399' },
  PREPARING: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  SHIPPED:   { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
  DELIVERED: { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
  CANCELLED: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
};

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: string;
  shopifyOrderId?: string | null;
}

interface SMSLog {
  id: number;
  phone: string;
  message: string;
  status: string;
  errorMessage?: string | null;
  createdAt: string;
}

interface OrderDetail extends Order {
  shop: { id: number; name: string; shopDomain: string };
  smsLogs: SMSLog[];
}

function getToken() {
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const sc = STATUS_COLORS[status] || { bg: 'rgba(255,255,255,0.05)', color: '#9ca3af' };
  return (
    <span style={{
      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
      background: sc.bg, color: sc.color, display: 'inline-block',
    }}>
      {label}
    </span>
  );
}

function OrderModal({
  order, onClose, onUpdate,
}: {
  order: OrderDetail;
  onClose: () => void;
  onUpdate: (updated: OrderDetail) => void;
}) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t('orders_status_pending'),
    CONFIRMED: t('orders_status_confirmed'),
    PREPARING: 'Hazırlanıyor',
    SHIPPED: 'Kargoda',
    DELIVERED: 'Teslim',
    CANCELLED: t('orders_status_cancelled'),
  };

  const STATUS_ACTIONS: { label: string; status: string; color: string }[] = [
    { label: t('orders_confirm_action'), status: 'CONFIRMED', color: '#059669' },
    { label: 'Hazırlanıyor',   status: 'PREPARING', color: '#3b82f6' },
    { label: 'Kargoya Verildi', status: 'SHIPPED',   color: '#7c3aed' },
    { label: 'Teslim Edildi',  status: 'DELIVERED', color: '#10b981' },
    { label: t('orders_cancel_action'), status: 'CANCELLED', color: '#dc2626' },
  ];

  async function handleStatusChange(status: string) {
    setUpdatingStatus(status);
    try {
      const res = await fetch(`${API}/orders/${order.id}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error_occurred'));
      onUpdate(data.order);
      showToast(`${t('orders_col_status')}: ${STATUS_LABELS[status]}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error_occurred'), 'error');
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleResendSMS() {
    setResending(true);
    try {
      const res = await fetch(`${API}/orders/${order.id}/resend-sms`, {
        method: 'POST', headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error_occurred'));
      showToast('SMS kuyruğa eklendi', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error_occurred'), 'error');
    } finally {
      setResending(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 100, padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(15,15,28,0.98)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 20, width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: 'rgba(15,15,28,0.98)',
          borderRadius: '20px 20px 0 0', zIndex: 1,
        }}>
          <div>
            <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>{t('orders_detail_title')}</div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>#{order.id}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, width: 36, height: 36, color: '#9ca3af', fontSize: 16,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >✕</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Customer info */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>{t('orders_detail_customer')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Ad Soyad', order.customerName],
                [t('orders_detail_phone'), order.customerPhone],
                [t('orders_detail_total'), `${order.total.toFixed(2)} ₺`],
                ['Mağaza', order.shop?.name || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
                  <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Order info */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Sipariş Bilgileri</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{t('orders_detail_status')}</div>
                <StatusBadge status={order.status} label={STATUS_LABELS[order.status] || order.status} />
              </div>
              <div>
                <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{t('orders_detail_date')}</div>
                <div style={{ color: '#e5e7eb', fontSize: 13 }}>
                  {new Date(order.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {order.shopifyOrderId && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Shopify Sipariş ID</div>
                  <div style={{ color: '#a78bfa', fontSize: 13, fontFamily: 'monospace' }}>#{order.shopifyOrderId}</div>
                </div>
              )}
            </div>
          </div>

          {/* Status actions */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Durumu Güncelle</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATUS_ACTIONS.filter(a => a.status !== order.status).map(a => (
                <button
                  key={a.status}
                  onClick={() => handleStatusChange(a.status)}
                  disabled={updatingStatus !== null}
                  style={{
                    padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    minHeight: 44,
                    background: updatingStatus === a.status ? 'rgba(255,255,255,0.05)' : `${a.color}22`,
                    border: `1px solid ${a.color}44`,
                    color: updatingStatus === a.status ? '#6b7280' : a.color,
                    cursor: updatingStatus !== null ? 'not-allowed' : 'pointer',
                  }}
                >
                  {updatingStatus === a.status ? '...' : a.label}
                </button>
              ))}
            </div>
          </div>

          {order.status === 'PENDING' && (
            <button
              onClick={handleResendSMS}
              disabled={resending}
              style={{
                padding: '14px', borderRadius: 10, fontSize: 14, fontWeight: 600, minHeight: 44,
                background: resending ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: 'none', color: '#fff', cursor: resending ? 'not-allowed' : 'pointer',
              }}
            >
              {resending ? t('loading') : '📱 SMS Yeniden Gönder'}
            </button>
          )}

          {/* SMS Logs */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>SMS Logları</div>
            {order.smsLogs.length === 0 ? (
              <div style={{ color: '#4b5563', fontSize: 13 }}>Henüz SMS gönderilmedi</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {order.smsLogs.map(log => (
                  <div
                    key={log.id}
                    style={{
                      background: log.status === 'SENT' ? 'rgba(5,150,105,0.06)' : 'rgba(239,68,68,0.06)',
                      border: `1px solid ${log.status === 'SENT' ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      borderRadius: 10, padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: log.status === 'SENT' ? '#34d399' : '#f87171' }}>
                        {log.status === 'SENT' ? '✓ Gönderildi' : '✗ Başarısız'}
                      </span>
                      <span style={{ color: '#4b5563', fontSize: 11 }}>
                        {new Date(log.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {log.status === 'SENT' && <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>{log.message}</div>}
                    {log.errorMessage && <div style={{ color: '#f87171', fontSize: 12 }}>{log.errorMessage}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const FILTERS_CONFIG = [
    { key: 'all', label: t('orders_all'), status: null },
    { key: 'pending', label: t('orders_pending'), status: 'PENDING' },
    { key: 'confirmed', label: t('orders_confirmed'), status: 'CONFIRMED' },
    { key: 'cancelled', label: t('orders_cancelled'), status: 'CANCELLED' },
  ];

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [filterKey, setFilterKey] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t('orders_status_pending'),
    CONFIRMED: t('orders_status_confirmed'),
    PREPARING: 'Hazırlanıyor',
    SHIPPED: 'Kargoda',
    DELIVERED: 'Teslim',
    CANCELLED: t('orders_status_cancelled'),
  };

  const fetchOrders = useCallback(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    setLoading(true);
    const activeFilter = FILTERS_CONFIG.find(f => f.key === filterKey);
    const status = activeFilter?.status ?? null;
    const url = `${API}/orders${status ? `?status=${status}` : ''}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setOrders(data.orders || []); setTotal(data.total || 0); })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, router]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function openDetail(orderId: number) {
    setLoadingDetail(orderId);
    try {
      const res = await fetch(`${API}/orders/${orderId}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error_occurred'));
      setSelectedOrder(data.order);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error_occurred'), 'error');
    } finally {
      setLoadingDetail(null);
    }
  }

  function handleOrderUpdate(updated: OrderDetail) {
    setSelectedOrder(updated);
    setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o));
  }

  const q = search.toLowerCase().trim();
  const filtered = q
    ? orders.filter(o => o.customerName.toLowerCase().includes(q) || o.customerPhone.toLowerCase().includes(q))
    : orders;

  const pad = isMobile ? '16px' : '40px 24px';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: pad }}>
        <div style={{ marginBottom: isMobile ? 16 : 28 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: '#fff', margin: '0 0 4px', fontFamily: "'Syne', sans-serif" }}>{t('orders_title')}</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>{t('orders_subtitle')} — {total}</p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('orders_search')}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8, fontSize: 14,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#e5e7eb', outline: 'none', fontFamily: 'inherit', minHeight: 44,
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: '0 4px', minHeight: 44 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          {FILTERS_CONFIG.map(f => (
            <button key={f.key} onClick={() => setFilterKey(f.key)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              minHeight: 44, whiteSpace: 'nowrap', flexShrink: 0,
              border: filterKey === f.key ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.07)',
              background: filterKey === f.key ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
              color: filterKey === f.key ? '#c4b5fd' : '#6b7280',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonTable rows={5} />
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#4b5563', fontSize: 14,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }}>
            {t('orders_empty')}
          </div>
        ) : isMobile ? (
          /* Mobile card view */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(order => {
              const sc = STATUS_COLORS[order.status] || { bg: 'rgba(255,255,255,0.05)', color: '#9ca3af' };
              const isLoadingThis = loadingDetail === order.id;
              return (
                <div
                  key={order.id}
                  onClick={() => !isLoadingThis && openDetail(order.id)}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 14, padding: '16px',
                    cursor: isLoadingThis ? 'not-allowed' : 'pointer',
                    opacity: isLoadingThis ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{order.customerName}</div>
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>#{order.id}</div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color, flexShrink: 0 }}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#9ca3af', fontSize: 13 }}>{order.customerPhone}</span>
                    <span style={{ color: '#34d399', fontSize: 14, fontWeight: 700 }}>{order.total.toFixed(2)} ₺</span>
                  </div>
                  <div style={{ color: '#4b5563', fontSize: 12, marginTop: 6 }}>
                    {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop table view */
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {[t('orders_col_id'), t('orders_col_customer'), t('orders_col_phone'), t('orders_col_total'), t('orders_col_status'), t('orders_col_date'), ''].map((h, i) => (
                    <th key={i} style={{ padding: '14px 20px', textAlign: 'left', color: '#4b5563', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>{t('orders_empty')}</td></tr>
                ) : filtered.map((order, i) => {
                  const sc = STATUS_COLORS[order.status] || { bg: 'rgba(255,255,255,0.05)', color: '#9ca3af' };
                  const isLoadingThis = loadingDetail === order.id;
                  return (
                    <tr key={order.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: 13 }}>#{order.id}</td>
                      <td style={{ padding: '14px 20px', color: '#e5e7eb', fontSize: 14, fontWeight: 500 }}>{order.customerName}</td>
                      <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: 13 }}>{order.customerPhone}</td>
                      <td style={{ padding: '14px 20px', color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>{order.total.toFixed(2)} ₺</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: 13 }}>
                        {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <button
                          onClick={() => openDetail(order.id)}
                          disabled={isLoadingThis}
                          style={{
                            padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
                            color: isLoadingThis ? '#6b7280' : '#a78bfa',
                            cursor: isLoadingThis ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          {isLoadingThis ? '...' : t('edit')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={handleOrderUpdate}
        />
      )}
    </div>
  );
}
