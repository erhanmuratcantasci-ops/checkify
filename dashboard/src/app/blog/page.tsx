import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';
import { posts } from './data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — Chekkify',
  description: 'E-ticaret ve kapıda ödeme doğrulama hakkında bilgiler',
};

export default function BlogPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", color: '#fff', position: 'relative' }}>
      <GeometricBackground />

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Logo size="sm" />
        <Link href="/" style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>← Ana Sayfa</Link>
      </nav>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '60px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 52 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: 100, padding: '5px 14px', marginBottom: 18,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px #a855f7' }} />
            <span style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 500 }}>Chekkify Blog</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            E-Ticaret Rehberi
          </h1>
          <p style={{ color: '#6b7280', fontSize: 16, margin: 0 }}>
            Kapıda ödeme, iade yönetimi ve mağaza optimizasyonu hakkında pratik içerikler.
          </p>
        </div>

        {/* Posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {posts.map((post, i) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: i === 0 ? 'rgba(139,92,246,0.07)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${i === 0 ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 18, padding: '28px 32px',
                transition: 'border-color 0.2s, background 0.2s',
                position: 'relative', overflow: 'hidden',
              }}>
                {i === 0 && (
                  <div style={{
                    position: 'absolute', top: -30, right: -30,
                    width: 140, height: 140, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {i === 0 && (
                    <span style={{
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      color: '#fff', fontSize: 10, fontWeight: 700,
                      padding: '3px 10px', borderRadius: 100, letterSpacing: '0.5px',
                    }}>ÖNE ÇIKAN</span>
                  )}
                  <span style={{ color: '#6b7280', fontSize: 12 }}>
                    {new Date(post.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span style={{ color: '#374151', fontSize: 12 }}>·</span>
                  <span style={{ color: '#6b7280', fontSize: 12 }}>{post.readTime}</span>
                </div>
                <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 10px', lineHeight: 1.3 }}>
                  {post.title}
                </h2>
                <p style={{ color: '#9ca3af', fontSize: 14, margin: '0 0 18px', lineHeight: 1.7 }}>
                  {post.excerpt}
                </p>
                <span style={{ color: '#a855f7', fontSize: 13, fontWeight: 600 }}>Devamını Oku →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px',
        textAlign: 'center',
        color: '#4b5563', fontSize: 13,
        position: 'relative', zIndex: 1,
        marginTop: 60,
      }}>
        © 2026 Chekkify. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
