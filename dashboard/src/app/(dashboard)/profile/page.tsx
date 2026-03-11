'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import { SkeletonProfile } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslation } from '@/lib/i18n';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

interface User {
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  referralCode?: string | null;
  referredCount?: number;
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}

function authHeaders(extra: Record<string, string> = {}) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...extra };
}

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

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
      if (!res.ok) throw new Error(data.error || t('error_occurred'));
      setUser(data.user);
      showToast(t('profile_toast_info_updated'), 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error_occurred'), 'error');
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showToast(t('profile_pw_mismatch'), 'error'); return; }
    if (newPassword.length < 6) { showToast(t('profile_pw_too_short'), 'error'); return; }
    setSavingPassword(true);
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error_occurred'));
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      showToast(t('profile_toast_pw_updated'), 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error_occurred'), 'error');
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
      if (!res.ok) throw new Error(data.error || t('error_occurred'));
      document.cookie = 'token=; path=/; max-age=0';
      router.push('/');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error_occurred'), 'error');
      setDeleting(false);
    }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const pad = isMobile ? '16px' : '40px 24px';

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Outfit', sans-serif", minHeight: 44,
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: isMobile ? '18px 16px' : '24px 28px',
    marginBottom: 14,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar />

      <main style={{ maxWidth: 600, margin: '0 auto', padding: pad }}>
        <div style={{ marginBottom: isMobile ? 20 : 28 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 10 }}>
            {t('back_dashboard')}
          </button>
          <h1 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>{t('profile_title')}</h1>
        </div>

        {loading ? <SkeletonProfile /> : <>

          {/* Avatar + meta */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color: '#fff',
              }}>{initials}</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>{user?.name || '—'}</div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              {[
                [t('profile_created_at'), user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                [t('profile_last_login'), user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('profile_last_login_unknown')],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{label}</div>
                  <div style={{ color: '#d1d5db', fontSize: 13 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div style={cardStyle}>
            <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>{t('profile_account_info')}</h2>
            <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>{t('profile_name')}</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={t('profile_name_placeholder')}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>{t('profile_email')}</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <button type="submit" disabled={savingInfo} style={{
                padding: '13px', background: savingInfo ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: savingInfo ? 'not-allowed' : 'pointer', minHeight: 44,
              }}>
                {savingInfo ? t('profile_saving_info') : t('profile_save_info')}
              </button>
            </form>
          </div>

          {/* Password */}
          <div style={cardStyle}>
            <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>{t('profile_change_password')}</h2>
            <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: t('profile_current_password'), value: currentPassword, onChange: setCurrentPassword },
                { label: t('profile_new_password'), value: newPassword, onChange: setNewPassword },
                { label: t('profile_confirm_password'), value: confirmPassword, onChange: setConfirmPassword },
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
                padding: '13px', background: savingPassword ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: savingPassword ? 'not-allowed' : 'pointer', minHeight: 44,
              }}>
                {savingPassword ? t('profile_changing_pw') : t('profile_change_pw')}
              </button>
            </form>
          </div>

          {/* Referral */}
          <div style={cardStyle}>
            <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
              Referral Programı
            </h2>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
              Davet kodunu paylaş — her yeni üye için sen ve arkadaşın <strong style={{ color: '#a78bfa' }}>50&apos;şer SMS kredisi</strong> kazanırsın.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <div style={{
                flex: 1, padding: '12px 14px',
                background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
                borderRadius: 10, fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
                color: '#c4b5fd', letterSpacing: '3px', textAlign: 'center',
              }}>
                {user?.referralCode || '—'}
              </div>
              <button
                onClick={() => {
                  if (user?.referralCode) {
                    navigator.clipboard.writeText(user.referralCode!);
                    showToast('Referral kodu kopyalandı', 'success');
                  }
                }}
                style={{
                  padding: '12px 18px', background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10,
                  color: '#a78bfa', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  minHeight: 44, whiteSpace: 'nowrap',
                }}
              >
                Kopyala
              </button>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
                Davet Ettiğin Kişi Sayısı
              </div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>
                {user?.referredCount ?? 0}
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div style={{ ...cardStyle, border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.04)', marginBottom: 0 }}>
            <h2 style={{ color: '#f87171', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 8px' }}>{t('profile_danger_zone')}</h2>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 14px' }}>
              {t('profile_danger_desc')}
            </p>
            <button onClick={() => setShowDelete(true)} style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '11px 20px', color: '#f87171',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44,
              width: isMobile ? '100%' : 'auto',
            }}>
              {t('profile_delete_account')}
            </button>
          </div>

        </>}
      </main>

      {/* Delete Confirm Modal */}
      {showDelete && (
        <div onClick={() => setShowDelete(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0f0f18', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 20, padding: isMobile ? '24px 20px' : '36px 32px',
            width: '100%', maxWidth: 420,
          }}>
            <h2 style={{ color: '#f87171', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{t('profile_delete_modal_title')}</h2>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>
              {t('profile_delete_modal_desc')}
            </p>
            <form onSubmit={handleDelete} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>{t('profile_delete_password_label')}</label>
                <input type="password" required value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="••••••••"
                  style={{ ...inputStyle }}
                  onFocus={e => e.target.style.borderColor = 'rgba(239,68,68,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={deleting} style={{
                  flex: 1, padding: '13px',
                  background: deleting ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                  border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer', minHeight: 44,
                }}>
                  {deleting ? t('profile_delete_deleting') : t('profile_delete_confirm')}
                </button>
                <button type="button" onClick={() => { setShowDelete(false); setDeletePassword(''); }} style={{
                  flex: 1, padding: '13px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                  color: '#9ca3af', fontSize: 14, cursor: 'pointer', minHeight: 44,
                }}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
