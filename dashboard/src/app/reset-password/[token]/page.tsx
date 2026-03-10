'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params['token'] as string;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Şifreler eşleşmiyor'); return; }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata oluştu');
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <GeometricBackground />
      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Logo size="lg" />
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px 32px', backdropFilter: 'blur(10px)', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>

          {success ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>Şifre Güncellendi!</h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...
              </p>
              <Link href="/login" style={{ color: '#a855f7', fontSize: 14, fontWeight: 500 }}>Hemen giriş yap →</Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 16 }}>🔑</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px', textAlign: 'center' }}>Yeni Şifre Belirle</h1>
              <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px', textAlign: 'center' }}>En az 6 karakter kullan</p>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 20 }}>{error}</div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Yeni Şifre</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Şifre Tekrar</label>
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, boxShadow: loading ? 'none' : '0 4px 20px rgba(139,92,246,0.35)' }}>
                  {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, marginBottom: 0, color: '#6b7280', fontSize: 14 }}>
                <Link href="/login" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 500 }}>← Giriş sayfasına dön</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
