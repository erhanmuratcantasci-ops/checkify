'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';

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

interface Order {
  id: number; customerName: string; customerPhone: string;
  total: number; status: string; createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('Tümü');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setLoading(true);
    const status = FILTER_MAP[filter];
    const url = `http://127.0.0.1:3001/orders${status ? `?status=${status}` : ''}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setOrders(data.orders || []); setTotal(data.total || 0); })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [filter, router]);

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
            <div style={{ padding: 60, textAlign: 'center', color: '#4b5563' }}>Yükleniyor...</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#4b5563', fontSize: 14 }}>Henüz sipariş yok</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Sipariş', 'Müşteri', 'Telefon', 'Tutar', 'Durum', 'Tarih'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: '#4b5563', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => {
                  const sc = STATUS_COLORS[order.status] || { bg: 'rgba(255,255,255,0.05)', color: '#9ca3af' };
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
