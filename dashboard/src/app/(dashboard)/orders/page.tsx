'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { orders, Order, OrderStatus, OrdersResponse } from '@/lib/api';
import Navbar from '@/components/Navbar';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  PREPARING: 'Hazırlanıyor',
  SHIPPED: 'Kargoya Verildi',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi',
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; color: string }> = {
  PENDING:   { bg: 'rgba(245,158,11,0.12)',  color: 'var(--status-pending)' },
  CONFIRMED: { bg: 'rgba(16,185,129,0.12)',  color: 'var(--status-confirmed)' },
  PREPARING: { bg: 'rgba(59,130,246,0.12)',  color: 'var(--status-preparing)' },
  SHIPPED:   { bg: 'rgba(168,85,247,0.12)',  color: 'var(--status-shipped)' },
  DELIVERED: { bg: 'rgba(6,214,160,0.12)',   color: 'var(--status-delivered)' },
  CANCELLED: { bg: 'rgba(239,68,68,0.12)',   color: 'var(--status-cancelled)' },
};

const ALL_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export default function OrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [activeStatus, setActiveStatus] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orders.list({ status: activeStatus || undefined, page, limit: 15 });
      setData(res);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [activeStatus, page, router]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  function handleStatusChange(status: OrderStatus | '') {
    setActiveStatus(status);
    setPage(1);
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-syne)' }}>Siparişler</h2>
          {data && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Toplam {data.total} sipariş</p>}
        </div>

        {/* Status Filtreleri */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['', ...ALL_STATUSES] as (OrderStatus | '')[]).map((s) => {
            const active = activeStatus === s;
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? 'var(--accent)' : 'var(--bg-surface)',
                  color: active ? 'var(--accent-fg)' : 'var(--text-secondary)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {s === '' ? 'Tümü' : STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>

        {/* Tablo */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20" style={{ background: 'var(--bg-surface)' }}>
              <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid var(--accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : !data || data.orders.length === 0 ? (
            <div className="text-center py-20 text-sm" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
              {activeStatus ? `"${STATUS_LABELS[activeStatus]}" durumunda sipariş yok` : 'Henüz sipariş yok'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  {['Sipariş', 'Müşteri', 'Telefon', 'Tutar', 'Durum', 'Tarih'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order: Order, i) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="cursor-pointer transition-colors"
                    style={{
                      background: 'var(--bg-surface)',
                      borderBottom: i < data.orders.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
                  >
                    <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                      #{order.id}
                      {order.shopifyOrderId && (
                        <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>#{order.shopifyOrderId}</span>
                      )}
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{order.customerName}</td>
                    <td className="px-6 py-4" style={{ color: 'var(--text-muted)' }}>{order.customerPhone}</td>
                    <td className="px-6 py-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{order.total.toFixed(2)} ₺</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-md text-xs font-semibold" style={STATUS_COLORS[order.status]}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4" style={{ color: 'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sayfalama */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {(page - 1) * 15 + 1}–{Math.min(page * 15, data.total)} / {data.total}
            </p>
            <div className="flex gap-2">
              {['Önceki', 'Sonraki'].map((label, i) => (
                <button
                  key={label}
                  onClick={() => setPage((p) => p + (i === 0 ? -1 : 1))}
                  disabled={i === 0 ? page === 1 : page === data.totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40 transition-all"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
