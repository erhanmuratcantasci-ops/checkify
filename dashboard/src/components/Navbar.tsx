'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Profil' },
  { href: '/orders', label: 'Siparişler' },
];

export default function Navbar({ userName }: { userName?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  return (
    <header className="px-6 py-4 flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-syne)' }}>
          Checkify
        </span>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: active ? 'var(--bg-overlay)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {userName && <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{userName}</span>}
        <button
          onClick={handleLogout}
          className="text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Çıkış yap
        </button>
      </div>
    </header>
  );
}
