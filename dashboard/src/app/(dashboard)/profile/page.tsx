'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import { SkeletonProfile } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

const API = 'http://127.0.0.1:3001';

interface User {
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}

function authHeaders(extra: Record<string, string> = {}) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...extra };
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#fff', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Outfit', sans-serif",
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16, padding: '24px 28px',
  marginBottom: 16,
};

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Info form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete modal
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    fetch(`${API}/auth/me`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const u = data.user ?? data;
        setUser(u);
        setName(u.name ?? '');
        setEmail(u.email ?? '');
        setLoading(false);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const body: Record<string, string> = {};
      if (name !== user?.name) body.name = name;
      if (email !== user?.email) body.email = email;
      const res = await fetch(`${API}/auth/me`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Güncelleme başarısız');
      setUser(data.user);
      showToast('Bilgiler güncellendi', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showToast('Yeni şifreler eşleşmiyor', 'error'); return; }
    if (newPassword.length < 6) { showToast('Şifre en az 6 karakter olmalı', 'error'); return; }
    setSavingPassword(true);
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Şifre değiştirilemedi');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      showToast('Şifre güncellendi', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: 'DELETE', headers: authHeaders(),
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hesap silinemedi');
      document.cookie = 'token=; path=/; max-age=0';
      router.push('/');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
      setDeleting(false);
    }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar userName={user?.name} />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 10 }}>
            ← Dashboard
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Profil</h1>
        </div>

        {loading ? <SkeletonProfile /> : <>

          {/* Avatar + meta */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: '#fff',
                boxShadow: '0 0 20px rgba(139,92,246,0.35)',
              }}>{initials}</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 17 }}>{user?.name || '—'}</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Kayıt tarihi', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                ['Son giriş', user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Bilinmiyor'],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{label}</div>
                  <div style={{ color: '#d1d5db', fontSize: 13 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bilgi düzenleme */}
          <div style={cardStyle}>
            <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 18px' }}>Hesap Bilgileri</h2>
            <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Ad Soyad</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Adınız Soyadınız"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <button type="submit" disabled={savingInfo} style={{
                padding: '11px', background: savingInfo ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: savingInfo ? 'not-allowed' : 'pointer', boxShadow: savingInfo ? 'none' : '0 4px 16px rgba(139,92,246,0.3)',
              }}>
                {savingInfo ? 'Kaydediliyor...' : 'Bilgileri Kaydet'}
              </button>
            </form>
          </div>

          {/* Şifre değiştirme */}
          <div style={cardStyle}>
            <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 18px' }}>Şifre Değiştir</h2>
            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Mevcut Şifre', value: currentPassword, onChange: setCurrentPassword },
                { label: 'Yeni Şifre', value: newPassword, onChange: setNewPassword },
                { label: 'Yeni Şifre (tekrar)', value: confirmPassword, onChange: setConfirmPassword },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>{f.label}</label>
                  <input type="password" required value={f.value} onChange={e => f.onChange(e.target.value)} placeholder="••••••••"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
              ))}
              <button type="submit" disabled={savingPassword} style={{
                padding: '11px', background: savingPassword ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: savingPassword ? 'not-allowed' : 'pointer', boxShadow: savingPassword ? 'none' : '0 4px 16px rgba(139,92,246,0.3)',
              }}>
                {savingPassword ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
              </button>
            </form>
          </div>

          {/* Hesap silme */}
          <div style={{ ...cardStyle, border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.04)', marginBottom: 0 }}>
            <h2 style={{ color: '#f87171', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 8px' }}>Tehlikeli Bölge</h2>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 16px' }}>
              Hesabınızı sildiğinizde tüm mağazalar, siparişler ve veriler kalıcı olarak silinir.
            </p>
            <button onClick={() => setShowDelete(true)} style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '10px 20px', color: '#f87171',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Hesabı Sil
            </button>
          </div>

        </>}
      </main>

      {/* Delete Confirm Modal */}
      {showDelete && (
        <div onClick={() => setShowDelete(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0f0f18', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 420,
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}>
            <h2 style={{ color: '#f87171', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Hesabı Sil</h2>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
              Bu işlem geri alınamaz. Tüm verileriniz silinecek. Devam etmek için şifrenizi girin.
            </p>
            <form onSubmit={handleDelete} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Şifreniz</label>
                <input type="password" required value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="••••••••"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(239,68,68,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={deleting} style={{
                  flex: 1, padding: '12px',
                  background: deleting ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                  border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}>
                  {deleting ? 'Siliniyor...' : 'Hesabı Kalıcı Sil'}
                </button>
                <button type="button" onClick={() => { setShowDelete(false); setDeletePassword(''); }} style={{
                  flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                  color: '#9ca3af', fontSize: 14, cursor: 'pointer',
                }}>
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
