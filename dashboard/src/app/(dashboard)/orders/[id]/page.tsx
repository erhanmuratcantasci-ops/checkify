'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { orders, OrderDetail, OrderStatus } from '@/lib/api';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  PREPARING: 'Hazırlanıyor',
  SHIPPED: 'Kargoya Verildi',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi',
  BLOCKED: 'Bloklandı',
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; color: string }> = {
  PENDING:   { bg: 'rgba(245,158,11,0.12)',  color: 'var(--color-warning)' },
  CONFIRMED: { bg: 'rgba(16,185,129,0.12)',  color: 'var(--color-success)' },
  PREPARING: { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa' },
  SHIPPED:   { bg: 'rgba(168,85,247,0.12)',  color: 'var(--color-accent)' },
  DELIVERED: { bg: 'rgba(6,214,160,0.12)',   color: 'var(--color-success)' },
  CANCELLED: { bg: 'rgba(239,68,68,0.12)',   color: 'var(--color-danger)' },
  BLOCKED:   { bg: 'rgba(220,38,38,0.15)',   color: '#f87171' },
};

const SMS_COLORS: Record<string, { bg: string; color: string }> = {
  SENT:    { bg: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' },
  PENDING: { bg: 'rgba(245,158,11,0.12)', color: 'var(--color-warning)' },
  FAILED:  { bg: 'rgba(239,68,68,0.12)',  color: 'var(--color-danger)' },
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = parseInt(params['id'] as string);
    if (isNaN(id)) { router.push('/orders'); return; }
    orders.get(id)
      .then(({ order }) => setOrder(order))
      .catch(() => router.push('/orders'))
      .finally(() => setLoading(false));
  }, [params, router]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>        <div className="flex items-center justify-center py-40">
          <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid var(--color-accent)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Başlık */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => router.push('/orders')}
              className="text-sm mb-2 flex items-center gap-1 transition-colors"
              style={{ color: 'var(--color-fg-subtle)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-fg)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-fg-subtle)'}
            >
              ← Siparişler
            </button>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-sans)' }}>
              Sipariş #{order.id}
            </h2>
            {order.shopifyOrderId && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-fg-subtle)' }}>Shopify #{order.shopifyOrderId}</p>
            )}
          </div>
          <span className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={STATUS_COLORS[order.status]}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Sipariş Bilgileri */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border-strong)' }}>
          {[
            ['Müşteri', order.customerName],
            ['Telefon', order.customerPhone],
            ['Tutar', `${order.total.toFixed(2)} ₺`],
            ['Mağaza', order.shop.name + (order.shop.shopDomain ? ` (${order.shop.shopDomain})` : '')],
            ['Tarih', new Date(order.createdAt).toLocaleString('tr-TR')],
          ].map(([label, value], i, arr) => (
            <div
              key={label}
              className="flex items-center justify-between px-6 py-4"
              style={{
                background: 'var(--color-bg-elevated)',
                borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <span className="text-sm" style={{ color: 'var(--color-fg-subtle)' }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* SMS Logları */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-fg-subtle)' }}>SMS Logları</h3>
          {order.smsLogs.length === 0 ? (
            <div className="rounded-2xl px-6 py-8 text-center text-sm" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-strong)', color: 'var(--color-fg-subtle)' }}>
              SMS gönderilmedi
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border-strong)' }}>
              {order.smsLogs.map((log, i) => (
                <div
                  key={log.id}
                  className="px-6 py-4"
                  style={{
                    background: 'var(--color-bg-elevated)',
                    borderBottom: i < order.smsLogs.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-fg-muted)' }}>{log.phone}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={SMS_COLORS[log.status] ?? { bg: 'var(--color-bg-overlay)', color: 'var(--color-fg-subtle)' }}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm break-all" style={{ color: 'var(--color-fg-subtle)' }}>{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
