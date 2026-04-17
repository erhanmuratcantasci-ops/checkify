'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  blockingStats,
  BlockingStatsResponse,
  BlockingRuleType,
  BlockSource,
} from '@/lib/api';

const SMS_COST = 0.25; // ₺

const SOURCE_COLORS: Record<BlockSource, string> = {
  LEGACY_PHONE:       '#9ca3af',
  LEGACY_POSTAL_CODE: '#6b7280',
  BLOCKING_RULE:      '#a78bfa',
  RATE_LIMIT:         '#fbbf24',
};

const SOURCE_LABELS: Record<BlockSource, string> = {
  LEGACY_PHONE:       'Telefon (Eski)',
  LEGACY_POSTAL_CODE: 'Posta Kodu (Eski)',
  BLOCKING_RULE:      'Kural',
  RATE_LIMIT:         'Limit Aşımı',
};

const RULE_TYPE_LABELS: Record<BlockingRuleType, string> = {
  IP_ADDRESS:           'IP Adresi',
  IP_RANGE:             'IP Aralığı',
  PHONE_PATTERN:        'Telefon Deseni',
  EMAIL_DOMAIN:         'Email Alan Adı',
  CUSTOMER_NAME:        'Müşteri Adı',
  MAX_ORDERS_PER_PHONE: 'Telefon Limiti',
  MAX_ORDERS_PER_IP:    'IP Limiti',
};

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
  padding: '24px 28px',
  marginBottom: 20,
};

const tooltipStyle: React.CSSProperties = {
  background: '#1a1a2e',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  color: '#e5e7eb',
  fontSize: 12,
  padding: '8px 12px',
};

function fmtDayLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function StatsTab({ shopId }: { shopId: number }) {
  const [stats, setStats] = useState<BlockingStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await blockingStats.get(shopId, days);
      setStats(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İstatistikler yüklenemedi');
    }
    setLoading(false);
  }, [shopId, days]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Yükleniyor…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ color: '#f87171', fontSize: 14, margin: 0 }}>⚠ {error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const totalBlocked = stats.totalBlocked;
  const estimatedSavings = totalBlocked * SMS_COST;

  // En sık tetiklenen kural türü (bySource + topRules kombine) — topRules'tan top #1
  const topRule = stats.topRules[0];

  // bySource → PieChart verisi
  const pieData = (Object.keys(SOURCE_LABELS) as BlockSource[])
    .map(src => ({ source: src, name: SOURCE_LABELS[src], value: stats.bySource[src] ?? 0 }))
    .filter(d => d.value > 0);

  // topRules → BarChart verisi
  const barData = stats.topRules.map(r => ({
    name: RULE_TYPE_LABELS[r.ruleType] ?? r.ruleType,
    value: r.matchCount,
    label: r.value.length > 20 ? r.value.slice(0, 18) + '…' : r.value,
  }));

  const metricCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={metricCard}>
          <div style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Toplam Bloklanan</div>
          <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🛡️</span>
            <span>{totalBlocked.toLocaleString('tr-TR')}</span>
          </div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Son {days} gün</div>
        </div>

        <div style={metricCard}>
          <div style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tahmini SMS Tasarrufu</div>
          <div style={{ color: '#34d399', fontSize: 28, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>💰</span>
            <span>~{estimatedSavings.toFixed(2)} ₺</span>
          </div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>{totalBlocked} × 0.25 ₺</div>
        </div>

        <div style={metricCard}>
          <div style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>En Sık Tetiklenen</div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🎯</span>
            <span>{topRule ? (RULE_TYPE_LABELS[topRule.ruleType] ?? topRule.ruleType) : '—'}</span>
          </div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>
            {topRule ? `${topRule.matchCount} eşleşme · ${topRule.value.length > 24 ? topRule.value.slice(0, 22) + '…' : topRule.value}` : 'Henüz veri yok'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 6, width: 'fit-content' }}>
        {([7, 30, 90] as const).map(d => {
          const active = days === d;
          return (
            <button key={d} onClick={() => setDays(d)}
              style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: active ? 'rgba(139,92,246,0.2)' : 'transparent',
                color: active ? '#a78bfa' : '#6b7280',
                fontWeight: active ? 700 : 500, fontSize: 13,
                cursor: 'pointer',
              }}>
              Son {d} Gün
            </button>
          );
        })}
      </div>

      {totalBlocked === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ color: '#9ca3af', margin: 0, fontSize: 14, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Henüz bloklama verisi yok. İlk bloklanan sipariş geldiğinde istatistikler burada görünecek.
          </p>
        </div>
      ) : (
        <>
          <div style={card}>
            <h3 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Günlük Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.byDay} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={fmtDayLabel} stroke="#6b7280" fontSize={11} tickMargin={8} />
                <YAxis allowDecimals={false} stroke="#6b7280" fontSize={11} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(v) => fmtDayLabel(String(v))}
                  formatter={(v) => [v, 'Bloklanan']}
                />
                <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: '#a78bfa' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <div style={card}>
              <h3 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Kaynak Dağılımı</h3>
              {pieData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: 13 }}>Veri yok</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                      {pieData.map((entry) => (
                        <Cell key={entry.source} fill={SOURCE_COLORS[entry.source]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={card}>
              <h3 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>En Çok Tetiklenen 5 Kural</h3>
              {barData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: 13 }}>Henüz kural eşleşmesi yok</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} stroke="#6b7280" fontSize={11} />
                    <YAxis type="category" dataKey="label" stroke="#6b7280" fontSize={11} width={100} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v, _name, p) => [v, (p && p.payload && typeof p.payload === 'object' && 'name' in p.payload) ? String(p.payload['name']) : 'Eşleşme']}
                    />
                    <Bar dataKey="value" fill="#a78bfa" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
