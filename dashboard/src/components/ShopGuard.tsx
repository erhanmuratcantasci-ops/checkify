'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const EXEMPT_PATHS = ['/shops', '/credits', '/pricing', '/profile', '/referral'];

export default function ShopGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (EXEMPT_PATHS.some(p => pathname.startsWith(p))) return;

    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
    if (!token) return;

    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    fetch(`${API}/shops`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (!data.shops || data.shops.length === 0) setShow(true);
      })
      .catch(() => {});
  }, [pathname]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(217,119,6,0.95)', border: '1px solid rgba(245,158,11,0.5)',
      borderRadius: 12, padding: '14px 24px', zIndex: 9999, maxWidth: 480, width: '90%',
      display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      <span style={{ fontSize: 22 }}>🏪</span>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#fff', fontWeight: 700, margin: '0 0 2px', fontSize: 14 }}>Mağaza bağlı değil</p>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: 13 }}>Sistemi kullanmak için bir Shopify mağazası bağlamalısınız.</p>
      </div>
      <button
        onClick={() => { setShow(false); window.location.href = '/shops'; }}
        style={{ background: '#fff', color: '#92400e', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        Mağaza Ekle
      </button>
    </div>
  );
}
