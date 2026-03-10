'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function Navbar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/orders', label: 'Siparişler' },
    { href: '/shops', label: 'Mağazalar' },
  ];

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
            const active = pathname === link.href;
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {userName && (
          <span style={{ color: '#6b7280', fontSize: 13 }}>{userName}</span>
        )}
        <button onClick={handleLogout} style={{
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
