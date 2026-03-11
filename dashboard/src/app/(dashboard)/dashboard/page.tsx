'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import { SkeletonCard } from '@/components/Skeleton';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslation } from '@/lib/i18n';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false });

interface Stats {
  total: number;
  revenue: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  todayOrders: number;
}

interface User {
  name: string;
  email: string;
  createdAt: string;
}

interface DailyPoint {
  date: string;
  count: number;
}

interface VerificationStats {
  confirmed: number;
  cancelled: number;
  pending: number;
}

function formatDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function DashboardPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, revenue: 0, pending: 0, confirmed: 0, cancelled: 0, todayOrders: 0 });
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [verification, setVerification] = useState<VerificationStats>({ confirmed: 0, cancelled: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/login'); return; }

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/auth/me`, { headers }).then(r => r.json()),
      fetch(`${API}/orders/stats`, { headers }).then(r => r.json()),
      fetch(`${API}/orders/stats/daily`, { headers }).then(r => r.json()),
      fetch(`${API}/orders/stats/verification`, { headers }).then(r => r.json()),
    ]).then(([userData, statsData, dailyData, verifyData]) => {
      setUser(userData.user ?? userData);
      const byStatus = statsData.byStatus || {};
      setStats({
        total: statsData.total ?? 0,
        revenue: statsData.totalRevenue ?? 0,
        pending: byStatus['PENDING'] ?? 0,
        confirmed: byStatus['CONFIRMED'] ?? 0,
        cancelled: byStatus['CANCELLED'] ?? 0,
        todayOrders: statsData.todayOrders ?? 0,
      });
      setDaily((dailyData.daily || []).map((d: DailyPoint) => ({ ...d, date: formatDay(d.date) })));
      setVerification({
        confirmed: verifyData.confirmed ?? 0,
        cancelled: verifyData.cancelled ?? 0,
        pending: verifyData.pending ?? 0,
      });
    }).catch(() => router.push('/login')).finally(() => setLoading(false));
  }, [router]);

  const statCards = [
    { label: t('dash_total_orders'), value: stats.total, sub: t('dash_sub_excl_cancelled'), icon: '📦', color: '#7c3aed' },
    { label: t('dash_revenue'), value: `${stats.revenue.toFixed(2)} ₺`, sub: t('dash_sub_excl_cancelled'), icon: '💰', color: '#059669' },
    { label: t('dash_pending'), value: stats.pending, sub: t('dash_sub_awaiting'), icon: '⏳', color: '#d97706' },
    { label: t('dash_today'), value: stats.todayOrders, sub: t('dash_sub_today'), icon: '📅', color: '#0891b2' },
  ];

  const hasChartData = daily.some(d => d.count > 0);
  const pad = isMobile ? '20px 16px' : '40px 24px';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: pad }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? 20 : 36 }}>
          <h1 style={{
            fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#fff', margin: '0 0 6px',
            fontFamily: "'Syne', sans-serif", letterSpacing: '-0.5px',
          }}>
            {loading ? t('dash_loading') : `${t('dash_welcome')} ${user?.name?.split(' ')[0]} 👋`}
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            {t('dash_subtitle')}
          </p>
        </div>

        {/* Stats Grid — 4 col desktop, 2x2 mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 10 : 16,
          marginBottom: isMobile ? 16 : 28,
        }}>
          {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : statCards.map((card, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: isMobile ? '14px 16px' : '20px 22px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80, borderRadius: '50%',
                background: `radial-gradient(circle, ${card.color}22 0%, transparent 70%)`,
              }} />
              <div style={{ fontSize: isMobile ? 18 : 22, marginBottom: isMobile ? 6 : 10 }}>{card.icon}</div>
              <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: '#fff', fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{card.label}</div>
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart — full width */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: isMobile ? '16px' : '24px 28px',
          marginBottom: isMobile ? 16 : 24,
        }}>
          <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
            {t('dash_chart_title')}
          </h2>
          {loading || daily.length === 0 ? (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#374151', fontSize: 13 }}>
                {loading ? t('dash_loading') : t('dash_no_data')}
              </div>
            </div>
          ) : (
            <div style={{ height: isMobile ? 150 : 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: isMobile ? -28 : -24 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#4b5563', fontSize: isMobile ? 10 : 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#4b5563', fontSize: isMobile ? 10 : 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(13,13,24,0.95)',
                      border: '1px solid rgba(139,92,246,0.25)',
                      borderRadius: 8, color: '#e5e7eb', fontSize: 13,
                    }}
                    cursor={{ stroke: 'rgba(139,92,246,0.2)', strokeWidth: 1 }}
                    formatter={(v) => [v, t('dash_tooltip_orders')]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={hasChartData ? '#a855f7' : '#374151'}
                    strokeWidth={2}
                    dot={{ fill: '#7c3aed', strokeWidth: 0, r: 4 }}
                    activeDot={{ fill: '#c084fc', r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Verification Rate Donut */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: isMobile ? '16px' : '24px 28px',
          marginBottom: isMobile ? 16 : 24,
        }}>
          <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
            Doğrulama Oranı
          </h2>
          {loading ? (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#374151', fontSize: 13 }}>Yükleniyor...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 32, flexWrap: 'wrap' }}>
              <div style={{ height: isMobile ? 120 : 150, width: isMobile ? 120 : 150, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Onaylanan', value: verification.confirmed },
                        { name: 'İptal', value: verification.cancelled },
                        { name: 'Bekleyen', value: verification.pending },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="80%"
                      dataKey="value"
                      strokeWidth={0}
                    >
                      <Cell fill="#059669" />
                      <Cell fill="#dc2626" />
                      <Cell fill="#d97706" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(13,13,24,0.95)',
                        border: '1px solid rgba(139,92,246,0.25)',
                        borderRadius: 8, color: '#e5e7eb', fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Onaylanan', value: verification.confirmed, color: '#059669' },
                  { label: 'İptal Edilen', value: verification.cancelled, color: '#dc2626' },
                  { label: 'Bekleyen', value: verification.pending, color: '#d97706' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ color: '#9ca3af', fontSize: 13 }}>{item.label}:</span>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: isMobile ? '16px' : '24px 28px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
              {t('dash_profile_title')}
            </h2>
            <button onClick={() => router.push('/profile')} style={{
              background: 'transparent', border: 'none',
              color: '#a855f7', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>{t('edit')} →</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#fff',
            }}>
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{user?.name || '—'}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{user?.email || '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              [t('dash_profile_email'), user?.email],
              [t('dash_profile_created'), user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{
                padding: '12px 0',
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
