'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="tr">
      <body style={{ margin: 0, minHeight: '100vh', background: '#0a0a0f', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '0 24px' }}>
          <div style={{
            fontSize: 80, fontWeight: 900, lineHeight: 1, marginBottom: 16,
            background: 'linear-gradient(135deg, #dc2626, #f87171)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>!</div>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>Kritik Hata</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>Uygulama beklenmedik bir hatayla karşılaştı.</p>
          <button onClick={reset} style={{
            padding: '12px 28px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Yeniden Dene
          </button>
        </div>
      </body>
    </html>
  );
}
