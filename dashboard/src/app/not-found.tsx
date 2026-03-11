import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';

export default function NotFound() {
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
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: 16, letterSpacing: '-4px',
        }}>
          404
        </div>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 10px' }}>
          Sayfa Bulunamadı
        </h1>
        <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 36px', maxWidth: 360, marginInline: 'auto' }}>
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
          }}>
            Dashboard&apos;a Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
