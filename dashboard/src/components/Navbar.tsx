'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const PLAN_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  FREE:     { label: 'Ücretsiz', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  STARTER:  { label: 'Starter',  color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  PRO:      { label: 'Pro',      color: '#a855f7', bg: 'rgba(168,85,247,0.2)' },
  BUSINESS: { label: 'Business', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
};

function getToken() {
  if (typeof window === 'undefined') return null;
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1] ?? null;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [userName, setUserName] = useState<string | null>(null);
  const [smsCredits, setSmsCredits] = useState<number | null>(null);
  const [whatsappCredits, setWhatsappCredits] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const u = data.user ?? data;
          setUserName(u.name ?? null);
          setSmsCredits(u.smsCredits ?? null);
          setWhatsappCredits(u.whatsappCredits ?? null);
          setUserPlan(u.plan ?? null);
        }
      })
      .catch(() => null);
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  useEffect(() => {
    const token = getCookie('token');
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    // Token 1 saatten az kaldıysa yenile
    const timeUntilExpiry = expiry - Date.now();
    if (timeUntilExpiry > 60 * 60 * 1000) return;

    const refreshToken = getCookie('refreshToken');
    if (!refreshToken) return;

    fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.token) {
          document.cookie = `token=${data.token}; path=/; max-age=${24 * 3600}; SameSite=Lax`;
        }
        if (data.refreshToken) {
          document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
        }
      })
      .catch(() => {});
  }, [API_URL]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function handleLogout() {
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  }

  const navLinks = [
    { href: '/dashboard', label: t('nav_dashboard'), icon: '◈' },
    { href: '/orders', label: t('nav_orders'), icon: '📦' },
    { href: '/rto', label: 'RTO', icon: '📉' },
    { href: '/shops', label: t('nav_shops'), icon: '🏪' },
    { href: '/credits', label: t('nav_credits'), icon: '💳' },
    { href: '/pricing', label: 'Fiyatlandırma', icon: '⭐' },
    { href: '/sms-logs', label: 'SMS Geçmişi', icon: '📋' },
    { href: '/blocklist', label: 'Engel Listesi', icon: '🚫' },
    { href: '/blocking-rules', label: 'Gelişmiş Engelleme', icon: '🛡️' },
    { href: '/profile', label: t('nav_profile'), icon: '👤' },
  ];

  const initials = userName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || null;

  if (isMobile) {
    return (
      <>
        {/* Mobile Navbar */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,10,15,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 16px',
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <Logo size="sm" />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Credit badge — always visible on mobile */}
            {smsCredits !== null && (
              <Link href="/credits" style={{
                display: 'flex', alignItems: 'center', gap: 4,
                textDecoration: 'none',
                padding: '4px 10px',
                borderRadius: 20,
                border: '1px solid rgba(139,92,246,0.25)',
                background: 'rgba(139,92,246,0.08)',
              }}>
                <span style={{ fontSize: 12 }}>📱</span>
                <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>
                  {smsCredits.toLocaleString('tr-TR')}
                </span>
              </Link>
            )}
            {whatsappCredits !== null && (
              <Link href="/credits" style={{
                display: 'flex', alignItems: 'center', gap: 4,
                textDecoration: 'none',
                padding: '4px 10px',
                borderRadius: 20,
                border: '1px solid rgba(37,211,102,0.25)',
                background: 'rgba(37,211,102,0.08)',
              }}>
                <span style={{ fontSize: 12 }}>💬</span>
                <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 700 }}>
                  {whatsappCredits.toLocaleString('tr-TR')}
                </span>
                <span style={{ color: '#6b7280', fontSize: 11 }}>WP</span>
              </Link>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                background: menuOpen ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${menuOpen ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8,
                width: 44, height: 44,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                cursor: 'pointer', padding: 0,
              }}
              aria-label="Menü"
            >
              <span style={{
                display: 'block', width: 18, height: 2, borderRadius: 1,
                background: menuOpen ? '#a78bfa' : '#9ca3af',
                transition: 'all 0.2s',
                transform: menuOpen ? 'translateY(6px) rotate(45deg)' : 'none',
              }} />
              <span style={{
                display: 'block', width: 18, height: 2, borderRadius: 1,
                background: menuOpen ? '#a78bfa' : '#9ca3af',
                transition: 'all 0.2s',
                opacity: menuOpen ? 0 : 1,
              }} />
              <span style={{
                display: 'block', width: 18, height: 2, borderRadius: 1,
                background: menuOpen ? '#a78bfa' : '#9ca3af',
                transition: 'all 0.2s',
                transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none',
              }} />
            </button>
          </div>
        </nav>

        {/* Backdrop */}
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)', zIndex: 48,
            }}
          />
        )}

        {/* Slide-in Menu */}
        <div style={{
          position: 'fixed', top: 56, right: 0, bottom: 0,
          width: 260,
          background: 'rgba(13,13,22,0.98)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          zIndex: 49,
          display: 'flex', flexDirection: 'column',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          padding: '16px 12px',
        }}>
          {/* User info */}
          {userName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 8,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{userName.split(' ')[0]}</div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>Chekkify</div>
              </div>
            </div>
          )}

          {/* Plan badge */}
          {userPlan && PLAN_BADGE[userPlan] && (
            <div style={{ padding: '8px 12px 12px' }}>
              <Link href="/pricing" style={{
                textDecoration: 'none',
                display: 'inline-block',
                padding: '4px 12px', borderRadius: 20,
                background: PLAN_BADGE[userPlan].bg,
                border: `1px solid ${PLAN_BADGE[userPlan].color}40`,
                color: PLAN_BADGE[userPlan].color,
                fontSize: 12, fontWeight: 700,
              }}>
                {PLAN_BADGE[userPlan].label}
              </Link>
            </div>
          )}

          {/* Nav links */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navLinks.map(link => {
              const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} style={{
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  fontSize: 15, fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : '#6b7280',
                  background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                  border: active ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                  minHeight: 44,
                }}>
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Language switcher in mobile menu */}
          <div style={{ padding: '12px 14px' }}>
            <LanguageSwitcher />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, color: '#9ca3af', fontSize: 15,
              cursor: 'pointer', width: '100%', textAlign: 'left',
              minHeight: 44,
            }}
          >
            <span>🚪</span> {t('nav_logout')}
          </button>
        </div>
      </>
    );
  }

  // Desktop Navbar
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(10,10,15,0.8)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '0 24px',
      height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <Logo size="sm" />
        </Link>
        <div style={{ display: 'flex', gap: 4 }}>
          {navLinks.map(link => {
            const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} style={{
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 14, fontWeight: 500,
                color: active ? '#fff' : '#6b7280',
                background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                border: active ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {smsCredits !== null && (
          <Link href="/credits" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            textDecoration: 'none',
            padding: '4px 10px',
            borderRadius: 20,
            border: '1px solid rgba(139,92,246,0.25)',
            background: 'rgba(139,92,246,0.08)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)')}
          >
            <span style={{ fontSize: 12 }}>📱</span>
            <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>
              {smsCredits.toLocaleString('tr-TR')}
            </span>
            <span style={{ color: '#6b7280', fontSize: 11 }}>{t('nav_credits_short')}</span>
          </Link>
        )}
        {whatsappCredits !== null && (
          <Link href="/credits" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            textDecoration: 'none',
            padding: '4px 10px',
            borderRadius: 20,
            border: '1px solid rgba(37,211,102,0.25)',
            background: 'rgba(37,211,102,0.08)',
          }}>
            <span style={{ fontSize: 12 }}>💬</span>
            <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 700 }}>
              {whatsappCredits.toLocaleString('tr-TR')}
            </span>
            <span style={{ color: '#6b7280', fontSize: 11 }}>WP</span>
          </Link>
        )}
        {userPlan && PLAN_BADGE[userPlan] && (
          <Link href="/pricing" style={{
            textDecoration: 'none',
            padding: '4px 12px', borderRadius: 20,
            background: PLAN_BADGE[userPlan].bg,
            border: `1px solid ${PLAN_BADGE[userPlan].color}40`,
            color: PLAN_BADGE[userPlan].color,
            fontSize: 12, fontWeight: 700,
          }}>
            {PLAN_BADGE[userPlan].label}
          </Link>
        )}
        <LanguageSwitcher />
        {userName && (
          <Link href="/profile" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', cursor: 'pointer',
            padding: '4px 10px 4px 4px',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.03)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {initials}
            </div>
            <span style={{ color: '#d1d5db', fontSize: 13, fontWeight: 500 }}>
              {userName.split(' ')[0]}
            </span>
          </Link>
        )}
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '6px 14px',
            color: '#9ca3af', fontSize: 13, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = '#fff'; (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
          onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = '#9ca3af'; (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          {t('nav_logout')}
        </button>
      </div>
    </nav>
  );
}
