'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

function getAdminToken() {
  return document.cookie.split('; ').find(r => r.startsWith('adminToken='))?.split('=')[1] ?? null;
}

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPw.length < 8) { setError('Yeni şifre en az 8 karakter olmalı'); return; }
    if (newPw !== confirm) { setError('Yeni şifreler eşleşmiyor'); return; }

    const token = getAdminToken();
    if (!token) { router.push('/admin/login'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/admin-auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Hata oluştu'); return; }
      setSuccess(true);
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
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(153,27,27,0.12)', border: '1px solid rgba(153,27,27,0.3)',
            borderRadius: 12, padding: '10px 20px',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #991b1b, #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>C</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Chekkify</div>
              <div style={{ color: '#fca5a5', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Panel</div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(13,13,22,0.98)', border: '1px solid rgba(153,27,27,0.2)',
          borderRadius: 20, padding: '32px 28px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Şifre Güncellendi</h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px' }}>Yeni şifrenizle giriş yapabilirsiniz.</p>
              <button
                onClick={() => router.push('/admin/login')}
                style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #991b1b, #b91c1c)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Giriş Sayfasına Dön →
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Şifre Değiştir</h1>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 28px' }}>Admin şifrenizi güncelleyin.</p>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, color: '#fca5a5', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Mevcut Şifre</label>
                  <input type="password" required value={current} onChange={e => setCurrent(e.target.value)} style={inputStyle} placeholder="••••••••" />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Yeni Şifre</label>
                  <input type="password" required value={newPw} onChange={e => setNewPw(e.target.value)} style={inputStyle} placeholder="Min. 8 karakter" />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Yeni Şifre (tekrar)</label>
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} placeholder="••••••••" />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    type="submit" disabled={loading}
                    style={{ flex: 1, padding: '13px', background: loading ? 'rgba(153,27,27,0.5)' : 'linear-gradient(135deg, #991b1b, #b91c1c)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', minHeight: 48 }}
                  >
                    {loading ? 'Güncelleniyor...' : 'Güncelle'}
                  </button>
                  <button
                    type="button" onClick={() => router.push('/admin/login')}
                    style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#9ca3af', fontSize: 14, cursor: 'pointer', minHeight: 48 }}
                  >
                    İptal
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
