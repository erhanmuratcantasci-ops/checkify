'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';

interface Stats {
  total: number;
  revenue: number;
  pending: number;
  confirmed: number;
}

interface User {
  name: string;
  email: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, revenue: 0, pending: 0, confirmed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    Promise.all([
      fetch('http://127.0.0.1:3001/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('http://127.0.0.1:3001/orders?limit=100', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([userData, ordersData]) => {
      setUser(userData.user ?? userData);
      const orders = ordersData.orders || [];
      setStats({
        total: orders.filter((o: {status: string}) => o.status !== 'CANCELLED').length,
        revenue: orders.filter((o: {status: string}) => o.status !== 'CANCELLED').reduce((sum: number, o: {total: number}) => sum + o.total, 0),
        pending: orders.filter((o: {status: string}) => o.status === 'PENDING').length,
        confirmed: orders.filter((o: {status: string}) => o.status === 'CONFIRMED').length,
      });
    }).catch(() => router.push('/login')).finally(() => setLoading(false));
  }, [router]);

  const statCards = [
    { label: 'Toplam Sipariş', value: stats.total, sub: 'iptal hariç', icon: '📦', color: '#7c3aed' },
    { label: 'Toplam Gelir', value: `${stats.revenue.toFixed(2)} ₺`, sub: 'iptal hariç', icon: '💰', color: '#059669' },
    { label: 'Bekleyen', value: stats.pending, sub: 'onay bekliyor', icon: '⏳', color: '#d97706' },
    { label: 'Onaylanan', value: stats.confirmed, sub: 'onaylandı', icon: '✅', color: '#7c3aed' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar userName={user?.name} />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 6px',
            fontFamily: "'Syne', sans-serif", letterSpacing: '-0.5px',
          }}>
            {loading ? 'Yükleniyor...' : `Hoş geldin, ${user?.name?.split(' ')[0]} 👋`}
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Chekkify dashboard — siparişlerini ve onaylarını yönet
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {statCards.map((card, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '20px 22px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80, borderRadius: '50%',
                background: `radial-gradient(circle, ${card.color}22 0%, transparent 70%)`,
              }} />
              <div style={{ fontSize: 22, marginBottom: 10 }}>{card.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>
                {loading ? '—' : card.value}
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{card.label}</div>
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Profile Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '24px 28px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
              Profil Bilgileri
            </h2>
            <button onClick={() => router.push('/profile')} style={{
              background: 'transparent', border: 'none',
              color: '#a855f7', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>Düzenle →</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: '#fff',
              boxShadow: '0 0 16px rgba(139,92,246,0.3)',
            }}>
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>{user?.name || '—'}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{user?.email || '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              ['Email', user?.email],
              ['Kayıt tarihi', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{
                padding: '14px 0',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ color: '#6b7280', fontSize: 13 }}>{label}</span>
                <span style={{ color: '#d1d5db', fontSize: 13 }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
