'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import { SkeletonProfile } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

interface User {
  name: string;
  email: string;
  createdAt: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "'DM Sans', sans-serif",
  transition: 'border-color 0.15s',
};

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/login'); return; }

    fetch('http://127.0.0.1:3001/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const u = data.user ?? data;
        setUser(u);
        setName(u.name ?? '');
        setEmail(u.email ?? '');
        setLoading(false);
      })
      .catch(() => { showToast('Profil yüklenemedi', 'error'); router.push('/login'); });
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);

    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
    try {
      const body: Record<string, string> = {};
      if (name !== user?.name) body.name = name;
      if (email !== user?.email) body.email = email;
      if (currentPassword) body.currentPassword = currentPassword;
      if (newPassword) body.newPassword = newPassword;

      const res = await fetch('http://127.0.0.1:3001/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Güncelleme başarısız');

      setUser(data.user);
      setCurrentPassword(''); setNewPassword('');
      setSuccess('Profil başarıyla güncellendi.');
      showToast('Profil güncellendi', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Hata oluştu';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar userName={user?.name} />
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Dashboard
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, fontFamily: "'Syne', sans-serif", letterSpacing: '-0.5px' }}>
            Profil Düzenle
          </h1>
        </div>

        {loading ? <SkeletonProfile /> : <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '28px 28px',
        }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#fff',
              boxShadow: '0 0 16px rgba(139,92,246,0.3)',
              flexShrink: 0,
            }}>
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600 }}>{user?.name || '—'}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>
                {user?.createdAt ? `Üye: ${new Date(user.createdAt).toLocaleDateString('tr-TR')}` : ''}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Ad Soyad', type: 'text', value: name, onChange: setName, placeholder: 'Adınız' },
                { label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'email@example.com', required: true },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={f.value}
                    required={f.required}
                    placeholder={f.placeholder}
                    onChange={e => f.onChange(e.target.value)}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 12px' }}>
                Şifre değiştir <span style={{ color: '#4b5563' }}>(isteğe bağlı)</span>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Mevcut şifre', value: currentPassword, onChange: setCurrentPassword },
                  { label: 'Yeni şifre', value: newPassword, onChange: setNewPassword },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>{f.label}</label>
                    <input
                      type="password"
                      value={f.value}
                      placeholder="••••••••"
                      onChange={e => f.onChange(e.target.value)}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px', color: '#34d399', fontSize: 13 }}>
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '11px',
                background: saving ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: 'none', borderRadius: 10, color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 4px 16px rgba(139,92,246,0.3)',
                transition: 'all 0.15s',
              }}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </form>
        </div>}
      </main>
    </div>
  );
}
