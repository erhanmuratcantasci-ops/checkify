'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
const WARN_THRESHOLD = 10;

export default function CreditWarning() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
    if (!token) return;
    fetch(`${API}/credits`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCredits(data.smsCredits ?? 0); })
      .catch(() => null);
  }, []);

  if (credits === null || credits >= WARN_THRESHOLD) return null;

  const isZero = credits === 0;

  return (
    <div style={{
      background: isZero ? 'rgba(239,68,68,0.08)' : 'rgba(217,119,6,0.08)',
      borderBottom: `1px solid ${isZero ? 'rgba(239,68,68,0.2)' : 'rgba(217,119,6,0.2)'}`,
      padding: '10px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 15 }}>{isZero ? '🚫' : '⚠️'}</span>
      <span style={{ color: isZero ? '#fca5a5' : '#fcd34d', fontSize: 13, fontWeight: 500 }}>
        {isZero
          ? 'SMS krediniz tükendi! Yeni siparişlere SMS gönderilemez.'
          : `Krediniz azalıyor! ${credits} SMS krediniz kaldı.`}
      </span>
      <Link href="/credits" style={{
        color: isZero ? '#f87171' : '#fbbf24',
        fontSize: 13, fontWeight: 700, textDecoration: 'none',
        borderBottom: `1px solid ${isZero ? 'rgba(248,113,113,0.4)' : 'rgba(251,191,36,0.4)'}`,
      }}>
        Kredi satın al →
      </Link>
    </div>
  );
}
