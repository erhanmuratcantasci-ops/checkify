'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const WARN_THRESHOLD = 10;

export default function CreditWarning() {
  const { t } = useTranslation();
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
          ? t('credit_warning_zero')
          : t('credit_warning_low').replace('{count}', String(credits))}
      </span>
      <Link href="/credits" style={{
        color: isZero ? '#f87171' : '#fbbf24',
        fontSize: 13, fontWeight: 700, textDecoration: 'none',
        borderBottom: `1px solid ${isZero ? 'rgba(248,113,113,0.4)' : 'rgba(251,191,36,0.4)'}`,
      }}>
        {t('credit_warning_buy')}
      </Link>
    </div>
  );
}
