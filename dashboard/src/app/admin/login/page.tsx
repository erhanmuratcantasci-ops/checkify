'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Giriş başarısız');
        return;
      }
      // Save adminToken cookie (8 hours)
      const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toUTCString();
      document.cookie = `adminToken=${data.adminToken}; path=/; expires=${expires}; SameSite=Strict`;
      router.push('/admin');
    } catch {
      setError('Sunucuya bağlanılamadı');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    color: '#e5e7eb', outline: 'none', boxSizing: 'border-box', minHeight: 46,
    fontFamily: "'Outfit', sans-serif",
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      fontFamily: "'Outfit', sans-serif", color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(153,27,27,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo / badge */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(153,27,27,0.12)', border: '1px solid rgba(153,27,27,0.3)',
            borderRadius: 12, padding: '10px 20px',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #991b1b, #b91c1c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900, color: '#fff',
            }}>C</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>Chekkify</div>
              <div style={{ color: '#fca5a5', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(13,13,22,0.98)', border: '1px solid rgba(153,27,27,0.2)',
          borderRadius: 20, padding: '32px 28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.5px' }}>Admin Girişi</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 28px' }}>Yalnızca yetkili admin erişebilir.</p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 18,
              color: '#fca5a5', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@chekkify.com"
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Şifre</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button" onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
                    fontSize: 15, padding: 4,
                  }}
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                padding: '13px', marginTop: 4,
                background: loading ? 'rgba(153,27,27,0.5)' : 'linear-gradient(135deg, #991b1b, #b91c1c)',
                border: 'none', borderRadius: 12, color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                minHeight: 48, transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button
              onClick={() => router.push('/admin/reset-password')}
              style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Şifremi Unuttum
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, color: '#374151', fontSize: 12 }}>
          Chekkify Admin — Yetkisiz erişim yasaktır.
        </div>
      </div>
    </div>
  );
}
