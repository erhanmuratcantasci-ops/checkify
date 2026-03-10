'use client';

import Link from 'next/link';
import { useState } from 'react';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "'Outfit', sans-serif",
};

export default function IletisimPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log({ name, email, message });
    setSent(true);
    setName(''); setEmail(''); setMessage('');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", color: '#fff', position: 'relative' }}>
      <GeometricBackground />

      {/* Header */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
        <Link href="/login" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14 }}>Giriş Yap</Link>
      </nav>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>← Ana Sayfa</Link>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Bize Ulaşın</h1>
          <p style={{ color: '#9ca3af', fontSize: 16, margin: 0, lineHeight: 1.6 }}>
            Sorularınız, önerileriniz veya destek talepleriniz için aşağıdaki formu doldurabilir ya da doğrudan e-posta gönderebilirsiniz.
          </p>
        </div>

        {/* Email card */}
        <div style={{ background: '#0f0f18', border: '1px solid #1a1a2e', borderRadius: 14, padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 2 }}>Destek E-postası</div>
            <a href="mailto:destek@checkify.com" style={{ color: '#a855f7', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>destek@checkify.com</a>
          </div>
        </div>

        {/* Form */}
        <div style={{ background: '#0f0f18', border: '1px solid #1a1a2e', borderRadius: 16, padding: '32px 28px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px', color: '#e5e7eb' }}>Mesaj Gönder</h2>

          {sent ? (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '16px 20px', color: '#34d399', fontSize: 15 }}>
              Mesajınız alındı! En kısa sürede dönüş yapacağız.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Ad Soyad</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Adınız"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>E-posta</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Mesajınız</label>
                <textarea required value={message} onChange={e => setMessage(e.target.value)} placeholder="Mesajınızı buraya yazın..."
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              <button type="submit" style={{
                padding: '13px',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: 'none', borderRadius: 10, color: '#fff',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
              }}>
                Gönder
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
