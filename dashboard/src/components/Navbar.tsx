'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

const API = 'http://127.0.0.1:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [smsCredits, setSmsCredits] = useState<number | null>(null);

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

  function handleLogout() {
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/orders', label: 'Siparişler' },
    { href: '/shops', label: 'Mağazalar' },
    { href: '/credits', label: 'Krediler' },
    { href: '/profile', label: 'Profil' },
  ];

  const initials = userName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || null;

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
          </Link>
        )}
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
          Çıkış
        </button>
      </div>
    </nav>
  );
}
