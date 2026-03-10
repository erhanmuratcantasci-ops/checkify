'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { orders, OrderDetail, OrderStatus } from '@/lib/api';
import Navbar from '@/components/Navbar';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Bekliyor',
  CONFIRMED: 'Onaylandı',
  PREPARING: 'Hazırlanıyor',
  SHIPPED: 'Kargoya Verildi',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  PREPARING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const SMS_STATUS_COLORS: Record<string, string> = {
  SENT: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-40">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Başlık */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/orders')}
              className="text-sm text-gray-500 hover:text-gray-900 mb-2 flex items-center gap-1"
            >
              ← Siparişler
            </button>
            <h2 className="text-2xl font-semibold text-gray-900">Sipariş #{order.id}</h2>
            {order.shopifyOrderId && (
              <p className="text-sm text-gray-400 mt-0.5">Shopify #{order.shopifyOrderId}</p>
            )}
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Sipariş Bilgileri */}
        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
          {[
            ['Müşteri', order.customerName],
            ['Telefon', order.customerPhone],
            ['Tutar', `${order.total.toFixed(2)} ₺`],
            ['Mağaza', order.shop.name + (order.shop.shopDomain ? ` (${order.shop.shopDomain})` : '')],
            ['Tarih', new Date(order.createdAt).toLocaleString('tr-TR')],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between px-6 py-4">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-900">{value}</span>
            </div>
          ))}
        </div>

        {/* SMS Logları */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">SMS Logları</h3>
          {order.smsLogs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl px-6 py-8 text-center text-sm text-gray-400">
              SMS gönderilmedi
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
              {order.smsLogs.map((log) => (
                <div key={log.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{log.phone}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${SMS_STATUS_COLORS[log.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 break-all">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
