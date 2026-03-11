import Link from 'next/link';
import { notFound } from 'next/navigation';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';
import { posts, getPost } from '../data';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return posts.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Blog — Chekkify' };
  return { title: `${post.title} — Chekkify Blog`, description: post.excerpt };
}

function renderContent(content: string) {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '36px 0 14px', letterSpacing: '-0.3px' }}>
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith('- **')) {
      const match = line.match(/- \*\*(.+?)\*\*[:\s]*(.*)/);
      if (match) {
        return (
          <li key={i} style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.7, margin: '6px 0' }}>
            <strong style={{ color: '#e5e7eb' }}>{match[1]}</strong>{match[2] ? `: ${match[2]}` : ''}
          </li>
        );
      }
    }
    if (line.startsWith('- ')) {
      return (
        <li key={i} style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.7, margin: '6px 0' }}>
          {line.slice(2)}
        </li>
      );
    }
    if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ') || line.startsWith('5. ') || line.startsWith('6. ') || line.startsWith('7. ')) {
      return (
        <li key={i} style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.7, margin: '6px 0', listStyleType: 'decimal' }}>
          {line.replace(/^\d+\. /, '')}
        </li>
      );
    }
    if (line.startsWith('`') && line.endsWith('`')) {
      return (
        <code key={i} style={{
          display: 'block', background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 8, padding: '12px 16px',
          color: '#c4b5fd', fontSize: 13, fontFamily: 'monospace',
          margin: '12px 0',
        }}>
          {line.slice(1, -1)}
        </code>
      );
    }
    if (line === '') {
      return <div key={i} style={{ height: 8 }} />;
    }
    // Inline bold
    const parts = line.split(/\*\*(.+?)\*\*/g);
    if (parts.length > 1) {
      return (
        <p key={i} style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.8, margin: '8px 0' }}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#e5e7eb' }}>{part}</strong> : part)}
        </p>
      );
    }
    return (
      <p key={i} style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.8, margin: '8px 0' }}>
        {line}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const postIndex = posts.findIndex(p => p.slug === slug);
  const prev = postIndex < posts.length - 1 ? posts[postIndex + 1] : null;
  const next = postIndex > 0 ? posts[postIndex - 1] : null;

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
        <Link href="/blog" style={{ color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>← Blog</Link>
      </nav>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 80px' }}>
        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ color: '#6b7280', fontSize: 13 }}>
            {new Date(post.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span style={{ color: '#374151' }}>·</span>
          <span style={{ color: '#6b7280', fontSize: 13 }}>{post.readTime}</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900,
          margin: '0 0 20px', lineHeight: 1.2, letterSpacing: '-0.5px',
        }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        <p style={{
          color: '#6b7280', fontSize: 17, lineHeight: 1.7,
          margin: '0 0 40px', padding: '0 0 36px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {post.excerpt}
        </p>

        {/* Content */}
        <div style={{ maxWidth: '100%' }}>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {renderContent(post.content)}
          </ul>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 56, padding: '32px', textAlign: 'center',
          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 20,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Chekkify&apos;ı Ücretsiz Deneyin</div>
          <p style={{ color: '#9ca3af', fontSize: 15, margin: '0 0 20px', lineHeight: 1.6 }}>
            50 SMS kredisiyle başlayın, kredi kartı gerekmez.
          </p>
          <Link href="/register" style={{
            display: 'inline-block', textDecoration: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            padding: '13px 32px', borderRadius: 12,
            boxShadow: '0 6px 20px rgba(139,92,246,0.35)',
          }}>
            Ücretsiz Başla →
          </Link>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'grid', gridTemplateColumns: prev && next ? '1fr 1fr' : '1fr',
          gap: 12, marginTop: 40, paddingTop: 36,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {prev && (
            <Link href={`/blog/${prev.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '16px 20px',
              }}>
                <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 6 }}>← Önceki</div>
                <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{prev.title}</div>
              </div>
            </Link>
          )}
          {next && (
            <Link href={`/blog/${next.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '16px 20px', textAlign: 'right',
              }}>
                <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 6 }}>Sonraki →</div>
                <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{next.title}</div>
              </div>
            </Link>
          )}
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 40px',
        display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 12,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
        <div style={{ color: '#4b5563', fontSize: 13 }}>© 2026 Chekkify. Tüm hakları saklıdır.</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['Blog', '/blog'], ['KVKK', '/kvkk'], ['Gizlilik Politikası', '/privacy'], ['Kullanım Koşulları', '/terms']].map(([l, h]) => (
            <Link key={l} href={h} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
