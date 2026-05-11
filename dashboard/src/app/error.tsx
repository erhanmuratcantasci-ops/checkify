'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';
import { useTranslation } from '@/lib/i18n';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      fontFamily: "'Outfit', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <GeometricBackground />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px' }}>
        <div style={{
          fontSize: 'clamp(96px, 20vw, 160px)', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, #dc2626 0%, #f87171 50%, #fca5a5 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: 16, letterSpacing: '-4px',
        }}>
          500
        </div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 10px' }}>
          {t('error_page_title')}
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 16px', maxWidth: 360, marginInline: 'auto' }}>
          {t('error_page_desc')}
        </p>

        {process.env.NODE_ENV === 'development' && error?.message && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 28,
            maxWidth: 480, marginInline: 'auto', textAlign: 'left',
          }}>
            <p style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 6px' }}>
              {t('error_dev_label')}
            </p>
            <code style={{ color: '#f87171', fontSize: 13, wordBreak: 'break-all' }}>{error.message}</code>
            {error.digest && (
              <p style={{ color: '#4b5563', fontSize: 12, margin: '6px 0 0' }}>Digest: {error.digest}</p>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} style={{
            padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
          }}>
            {t('error_reset')}
          </button>
          <Link href="/dashboard" style={{
            padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#d1d5db', textDecoration: 'none',
          }}>
            {t('error_back_to_dashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
