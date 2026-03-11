'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import GeometricBackground from '@/components/GeometricBackground';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

interface OrderStatus {
  id: number;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  shopName: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  PENDING:    { label: 'Sipariş Bekleniyor',  color: '#d97706', icon: '⏳' },
  CONFIRMED:  { label: 'Sipariş Onaylandı',   color: '#059669', icon: '✅' },
  PREPARING:  { label: 'Hazırlanıyor',         color: '#0891b2', icon: '👨‍🍳' },
  SHIPPED:    { label: 'Kargoya Verildi',      color: '#7c3aed', icon: '🚚' },
  DELIVERED:  { label: 'Teslim Edildi',        color: '#059669', icon: '📦' },
  CANCELLED:  { label: 'Sipariş İptal Edildi', color: '#dc2626', icon: '❌' },
};

export default function StatusPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/status/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setOrder(data.order);
      })
      .catch(() => setError('Sipariş bilgisi yüklenemedi'))
      .finally(() => setLoading(false));
  }, [token]);

  const statusInfo = order ? (STATUS_LABELS[order.status] ?? { label: order.status, color: '#6b7280', icon: '📋' }) : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <GeometricBackground />

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 480,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.1))',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 12, padding: '10px 18px',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
            }}>C</div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff' }}>
              chekkify
            </span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20,
          padding: '32px 28px',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px 0' }}>
              Yükleniyor...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <div style={{ color: '#ef4444', fontSize: 16, fontWeight: 500 }}>{error}</div>
            </div>
          ) : order && statusInfo ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>{statusInfo.icon}</div>
                <div style={{
                  fontSize: 20, fontWeight: 700, color: statusInfo.color,
                  fontFamily: "'Syne', sans-serif",
                }}>
                  {statusInfo.label}
                </div>
                <div style={{ color: '#6b7280', fontSize: 14, marginTop: 6 }}>
                  {order.shopName}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  ['Sipariş No', `#${order.id}`],
                  ['Müşteri', order.customerName],
                  ['Tutar', `${order.total.toFixed(2)} ₺`],
                  ['Tarih', new Date(order.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ color: '#6b7280', fontSize: 14 }}>{label}</span>
                    <span style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Status badge */}
              <div style={{
                marginTop: 20,
                padding: '12px 16px',
                borderRadius: 10,
                background: `${statusInfo.color}15`,
                border: `1px solid ${statusInfo.color}30`,
                textAlign: 'center',
                color: statusInfo.color,
                fontSize: 13,
                fontWeight: 500,
              }}>
                Güncel durum: {statusInfo.label}
              </div>
            </>
          ) : null}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, color: '#374151', fontSize: 12 }}>
          Powered by chekkify
        </div>
      </div>
    </div>
  );
}
