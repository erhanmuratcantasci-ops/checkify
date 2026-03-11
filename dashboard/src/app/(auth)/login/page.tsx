'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';
import { useTranslation } from '@/lib/i18n';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#fff', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
};

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('login_error_default'));
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      if (data.refreshToken) {
        document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_occurred'));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('forgot_error_default'));
      setForgotSuccess(true);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : t('forgot_error_default'));
    } finally {
      setForgotLoading(false);
    }
  }

  function openForgot() {
    setForgotOpen(true);
    setForgotEmail('');
    setForgotSuccess(false);
    setForgotError('');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <GeometricBackground />
      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Logo size="lg" />
          <p style={{ color: '#6b7280', fontSize: 14, margin: '8px 0 0' }}>{t('login_subtitle')}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '36px 32px', backdropFilter: 'blur(10px)', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>{t('login_welcome')}</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>{t('login_sign_in_subtitle')}</p>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 20 }}>{error}</div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{t('login_email')}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>{t('login_password')}</label>
                <button type="button" onClick={openForgot} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                  {t('login_forgot')}
                </button>
              </div>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, boxShadow: loading ? 'none' : '0 4px 20px rgba(139,92,246,0.35)' }}>
              {loading ? t('login_submitting') : t('login_submit')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#4b5563', fontSize: 12 }}>{t('or')}</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/auth/google/callback' })}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {t('login_google')}
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, marginBottom: 0, color: '#6b7280', fontSize: 14 }}>
            {t('login_no_account')}{' '}
            <Link href="/register" style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 500 }}>{t('login_register_link')}</Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div
          onClick={() => setForgotOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'rgba(13,13,24,0.98)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 400, boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}
          >
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 16 }}>🔑</div>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>{t('forgot_title')}</h2>

            {forgotSuccess ? (
              <>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
                  <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                    {t('forgot_sent_desc')}
                  </p>
                </div>
                <button
                  onClick={() => setForgotOpen(false)}
                  style={{ width: '100%', marginTop: 20, padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('ok')}
                </button>
              </>
            ) : (
              <>
                <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', margin: '0 0 24px' }}>
                  {t('forgot_desc')}
                </p>
                {forgotError && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 16 }}>{forgotError}</div>
                )}
                <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    style={{ ...inputStyle, border: '1px solid rgba(139,92,246,0.3)' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.3)'}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      style={{ flex: 1, padding: '12px', background: forgotLoading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: forgotLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {forgotLoading ? t('forgot_sending') : t('forgot_send')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(false)}
                      style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9ca3af', fontSize: 14, cursor: 'pointer' }}
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
