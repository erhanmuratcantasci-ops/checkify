'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type State = 'loading' | 'success' | 'error';

interface Order {
  id: number;
  customerName: string;
  total: number;
}

export default function CancelPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>('loading');
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/confirm/cancel/${token}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'İşlem başarısız');
        setOrder(data.order);
        setState('success');
      })
      .catch(err => {
        setErrorMsg(err instanceof Error ? err.message : 'Bir hata oluştu');
        setState('error');
      });
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      fontFamily: "'Outfit', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <GeometricBackground />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px', width: '100%', maxWidth: 480 }}>

        <div style={{ marginBottom: 40 }}>
          <Logo size="lg" />
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${state === 'success' ? 'rgba(239,68,68,0.25)' : state === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 20, padding: '48px 36px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        }}>
          {state === 'loading' && (
            <>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 24px',
                border: '3px solid rgba(239,68,68,0.2)',
                borderTopColor: '#f87171',
                animation: 'spin 1s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: '#9ca3af', fontSize: 15, margin: 0 }}>Sipariş iptal ediliyor...</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
                background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#f87171', fontSize: 32,
              }}>✕</div>
              <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
                Siparişiniz İptal Edildi
              </h1>
              {order && (
                <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 8px' }}>
                  Merhaba {order.customerName}, {order.total.toFixed(2)} ₺ tutarındaki siparişiniz iptal edildi.
                </p>
              )}
              <p style={{ color: '#4b5563', fontSize: 13, margin: '0 0 32px' }}>
                İptal işleminiz alındı. Yeni sipariş oluşturmak için mağazamızı ziyaret edebilirsiniz.
              </p>
              <div style={{
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 12, padding: '14px 20px',
                color: '#f87171', fontSize: 14, fontWeight: 500,
              }}>
                Sipariş başarıyla iptal edildi
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
                background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#f87171', fontSize: 32,
              }}>!</div>
              <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>
                İşlem Başarısız
              </h1>
              <p style={{ color: '#9ca3af', fontSize: 14, margin: '0 0 28px' }}>
                {errorMsg}
              </p>
              <Link href="/" style={{
                display: 'inline-block', padding: '11px 28px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: '#d1d5db', fontSize: 14, textDecoration: 'none',
              }}>
                Ana Sayfaya Dön
              </Link>
            </>
          )}
        </div>

        <p style={{ color: '#374151', fontSize: 12, marginTop: 24 }}>
          Chekkify — COD Sipariş Doğrulama
        </p>
      </div>
    </div>
  );
}
