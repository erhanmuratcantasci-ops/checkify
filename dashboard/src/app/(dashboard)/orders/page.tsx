'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import { SkeletonTable } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

const API = 'http://127.0.0.1:3001';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor', CONFIRMED: 'Onaylandı', PREPARING: 'Hazırlanıyor',
  SHIPPED: 'Kargoda', DELIVERED: 'Teslim', CANCELLED: 'İptal',
};
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: 'rgba(217,119,6,0.15)',  color: '#fbbf24' },
  CONFIRMED: { bg: 'rgba(5,150,105,0.15)',  color: '#34d399' },
  PREPARING: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  SHIPPED:   { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
  DELIVERED: { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7' },
  CANCELLED: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
};

const FILTERS = ['Tümü','Bekliyor','Onaylandı','Hazırlanıyor','Kargoda','Teslim','İptal'];
const FILTER_MAP: Record<string, string | null> = {
  'Tümü': null, 'Bekliyor': 'PENDING', 'Onaylandı': 'CONFIRMED',
  'Hazırlanıyor': 'PREPARING', 'Kargoda': 'SHIPPED', 'Teslim': 'DELIVERED', 'İptal': 'CANCELLED',
};

const STATUS_ACTIONS: { label: string; status: string; color: string }[] = [
  { label: 'Onayla',         status: 'CONFIRMED', color: '#059669' },
  { label: 'Hazırlanıyor',   status: 'PREPARING', color: '#3b82f6' },
  { label: 'Kargoya Verildi',status: 'SHIPPED',   color: '#7c3aed' },
  { label: 'Teslim Edildi',  status: 'DELIVERED', color: '#10b981' },
  { label: 'İptal Et',       status: 'CANCELLED', color: '#dc2626' },
];

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

function StatusBadge({ status }: { status: string }) {
  const sc = STATUS_COLORS[status] || { bg: 'rgba(255,255,255,0.05)', color: '#9ca3af' };
  return (
    <span style={{
      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
      background: sc.bg, color: sc.color, display: 'inline-block',
    }}>
      {STATUS_LABELS[status] || status}
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
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  async function handleStatusChange(status: string) {
    setUpdatingStatus(status);
    try {
      const res = await fetch(`${API}/orders/${order.id}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Durum güncellenemedi');
      onUpdate(data.order);
      showToast(`Durum güncellendi: ${STATUS_LABELS[status]}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
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
      if (!res.ok) throw new Error(data.error || 'SMS gönderilemedi');
      showToast('SMS kuyruğa eklendi', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
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
        justifyContent: 'center', zIndex: 100, padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(15,15,28,0.98)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 20, width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: 'rgba(15,15,28,0.98)',
          borderRadius: '20px 20px 0 0', zIndex: 1,
        }}>
          <div>
            <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
              Sipariş Detayı
            </div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>#{order.id}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, width: 32, height: 32, color: '#9ca3af', fontSize: 16,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Müşteri bilgileri */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Müşteri</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Ad Soyad', order.customerName],
                ['Telefon', order.customerPhone],
                ['Tutar', `${order.total.toFixed(2)} ₺`],
                ['Mağaza', order.shop?.name || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
                  <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Durum & meta */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Sipariş Bilgileri</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Durum</div>
                <StatusBadge status={order.status} />
              </div>
              <div>
                <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Oluşturulma</div>
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

          {/* Durum değiştirme */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>Durumu Güncelle</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {STATUS_ACTIONS.filter(a => a.status !== order.status).map(a => (
                <button
                  key={a.status}
                  onClick={() => handleStatusChange(a.status)}
                  disabled={updatingStatus !== null}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: updatingStatus === a.status ? 'rgba(255,255,255,0.05)' : `${a.color}22`,
                    border: `1px solid ${a.color}44`,
                    color: updatingStatus === a.status ? '#6b7280' : a.color,
                    cursor: updatingStatus !== null ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {updatingStatus === a.status ? '...' : a.label}
                </button>
              ))}
            </div>
          </div>

          {/* SMS yeniden gönder */}
          {order.status === 'PENDING' && (
            <button
              onClick={handleResendSMS}
              disabled={resending}
              style={{
                padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: resending ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: 'none', color: '#fff', cursor: resending ? 'not-allowed' : 'pointer',
                boxShadow: resending ? 'none' : '0 4px 16px rgba(139,92,246,0.3)',
                transition: 'all 0.15s',
              }}
            >
              {resending ? 'Gönderiliyor...' : '📱 SMS Yeniden Gönder'}
            </button>
          )}

          {/* SMS logları */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 }}>SMS Logları</div>
            {order.smsLogs.length === 0 ? (
              <div style={{ color: '#4b5563', fontSize: 13 }}>Henüz SMS gönderilmedi</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {order.smsLogs.map(log => (
                  <div
                    key={log.id}
                    style={{
                      background: log.status === 'SENT'
                        ? 'rgba(5,150,105,0.06)'
                        : 'rgba(239,68,68,0.06)',
                      border: `1px solid ${log.status === 'SENT' ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      borderRadius: 10, padding: '12px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                        color: log.status === 'SENT' ? '#34d399' : '#f87171',
                      }}>
                        {log.status === 'SENT' ? '✓ Gönderildi' : '✗ Başarısız'}
                      </span>
                      <span style={{ color: '#4b5563', fontSize: 11 }}>
                        {new Date(log.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {log.status === 'SENT' && (
                      <div style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.5 }}>{log.message}</div>
                    )}
                    {log.errorMessage && (
                      <div style={{ color: '#f87171', fontSize: 12 }}>{log.errorMessage}</div>
                    )}
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('Tümü');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);

  const fetchOrders = useCallback(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    setLoading(true);
    const status = FILTER_MAP[filter];
    const url = `${API}/orders${status ? `?status=${status}` : ''}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setOrders(data.orders || []); setTotal(data.total || 0); })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [filter, router]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function openDetail(orderId: number) {
    setLoadingDetail(orderId);
    try {
      const res = await fetch(`${API}/orders/${orderId}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Detay yüklenemedi');
      setSelectedOrder(data.order);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
    } finally {
      setLoadingDetail(null);
    }
  }

  function handleOrderUpdate(updated: OrderDetail) {
    setSelectedOrder(updated);
    setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 4px', fontFamily: "'Syne', sans-serif" }}>Siparişler</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Toplam {total} sipariş</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: filter === f ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.07)',
              background: filter === f ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
              color: filter === f ? '#c4b5fd' : '#6b7280',
              transition: 'all 0.15s',
            }}>{f}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, overflow: 'hidden',
        }}>
          {loading ? (
            <SkeletonTable rows={5} />
          ) : orders.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#4b5563', fontSize: 14 }}>Henüz sipariş yok</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Sipariş', 'Müşteri', 'Telefon', 'Tutar', 'Durum', 'Tarih', ''].map((h, i) => (
                    <th key={i} style={{ padding: '14px 20px', textAlign: 'left', color: '#4b5563', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => {
                  const sc = STATUS_COLORS[order.status] || { bg: 'rgba(255,255,255,0.05)', color: '#9ca3af' };
                  const isLoadingThis = loadingDetail === order.id;
                  return (
                    <tr key={order.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
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
                            background: 'rgba(139,92,246,0.12)',
                            border: '1px solid rgba(139,92,246,0.25)',
                            color: isLoadingThis ? '#6b7280' : '#a78bfa',
                            cursor: isLoadingThis ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s', whiteSpace: 'nowrap',
                          }}
                        >
                          {isLoadingThis ? '...' : 'Detay'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
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
