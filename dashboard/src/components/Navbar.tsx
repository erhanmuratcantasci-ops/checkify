'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [userName, setUserName] = useState<string | null>(null);
  const [smsCredits, setSmsCredits] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
        }
      })
      .catch(() => null);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function handleLogout() {
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  }

  const navLinks = [
    { href: '/dashboard', label: t('nav_dashboard'), icon: '◈' },
    { href: '/orders', label: t('nav_orders'), icon: '📦' },
    { href: '/shops', label: t('nav_shops'), icon: '🏪' },
    { href: '/credits', label: t('nav_credits'), icon: '💳' },
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
