'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import { useIsMobile } from '@/hooks/useIsMobile';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });

interface RTOData {
  rtoRate: number;
  cancelled: number;
  total: number;
  trend: { date: string; count: number }[];
  topPhones: { phone: string; count: number }[];
}

function formatDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function RTOPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [data, setData] = useState<RTOData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/login'); return; }

    fetch(`${API}/orders/stats/rto`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const trendWithLabel = data?.trend.map(d => ({ ...d, date: formatDay(d.date) })) ?? [];
  const pad = isMobile ? '20px 16px' : '40px 24px';
  const card = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: isMobile ? '16px' : '24px 28px',
    marginBottom: isMobile ? 16 : 24,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: pad }}>
        <div style={{ marginBottom: isMobile ? 20 : 36 }}>
          <h1 style={{
            fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#fff', margin: '0 0 6px',
            fontFamily: "'Syne', sans-serif", letterSpacing: '-0.5px',
          }}>
            📉 RTO Analizi
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Return to Origin — İptal edilen sipariş oranı ve trendleri
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 10 : 16,
          marginBottom: isMobile ? 16 : 24,
        }}>
          {[
            { label: 'RTO Oranı', value: loading ? '—' : `${data?.rtoRate ?? 0}%`, color: '#dc2626', icon: '📉' },
            { label: 'İptal Edilen', value: loading ? '—' : String(data?.cancelled ?? 0), color: '#d97706', icon: '❌' },
            { label: 'Toplam Sipariş', value: loading ? '—' : String(data?.total ?? 0), color: '#7c3aed', icon: '📦' },
          ].map((card, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: isMobile ? '14px 16px' : '20px 22px',
            }}>
              <div style={{ fontSize: isMobile ? 18 : 22, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 700, color: card.color, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* 30-Day Trend */}
        <div style={card}>
          <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
            30 Günlük İptal Trendi
          </h2>
          {loading || !data ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#374151', fontSize: 13 }}>Yükleniyor...</div>
            </div>
          ) : (
            <div style={{ height: isMobile ? 150 : 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendWithLabel} margin={{ top: 4, right: 4, bottom: 0, left: isMobile ? -28 : -24 }}>
                  <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: isMobile ? 9 : 11 }} axisLine={false} tickLine={false} interval={isMobile ? 6 : 4} />
                  <YAxis allowDecimals={false} tick={{ fill: '#4b5563', fontSize: isMobile ? 10 : 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(13,13,24,0.95)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8, color: '#e5e7eb', fontSize: 13 }}
                    formatter={(v) => [v, 'İptal']}
                  />
                  <Line type="monotone" dataKey="count" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', strokeWidth: 0, r: 3 }} activeDot={{ fill: '#f87171', r: 5, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Phones */}
        <div style={card}>
          <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
            En Çok İptal Yapan Numaralar
          </h2>
          {loading ? (
            <div style={{ color: '#374151', fontSize: 13 }}>Yükleniyor...</div>
          ) : !data?.topPhones.length ? (
            <div style={{ color: '#4b5563', fontSize: 13, padding: '20px 0' }}>Henüz iptal verisi yok</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.topPhones.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px',
                  background: 'rgba(220,38,38,0.05)',
                  border: '1px solid rgba(220,38,38,0.1)',
                  borderRadius: 10,
                }}>
                  <span style={{ color: '#9ca3af', fontSize: 14, fontFamily: 'monospace' }}>{p.phone}</span>
                  <span style={{
                    background: 'rgba(220,38,38,0.15)', color: '#f87171',
                    padding: '2px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  }}>{p.count} iptal</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
