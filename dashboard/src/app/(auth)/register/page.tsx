'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#fff', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kayıt başarısız');
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <GeometricBackground />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120,60,220,0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '20%', left: '10%', width: 300, height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ marginBottom: 8 }}>
            <Logo size="lg" />
          </div>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>COD doğrulama platformu</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '36px 32px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px', fontFamily: "'Syne', sans-serif" }}>Hesap oluştur</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>Chekkify'a üye ol, ücretsiz başla</p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 20,
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Ad Soyad</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Adınız Soyadınız"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Şifre</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px',
              background: loading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
              border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(139,92,246,0.35)',
            }}>
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, marginBottom: 0, color: '#6b7280', fontSize: 14 }}>
            Zaten hesabın var mı?{' '}
            <Link href="/login" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 500 }}>Giriş yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
