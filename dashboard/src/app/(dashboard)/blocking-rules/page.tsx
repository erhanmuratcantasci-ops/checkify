'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import RulesTab from './components/RulesTab';
import BlockedOrdersTab from './components/BlockedOrdersTab';
import StatsTab from './components/StatsTab';
import SettingsTab from './components/SettingsTab';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}

interface Shop { id: number; name: string; shopDomain: string | null }
type Tab = 'rules' | 'blocked-orders' | 'stats' | 'settings';

const TAB_LABELS: Record<Tab, { label: string; icon: string }> = {
  'rules':          { label: 'Kurallar',              icon: '📜' },
  'blocked-orders': { label: 'Bloklanan Siparişler',  icon: '📦' },
  'stats':          { label: 'İstatistikler',         icon: '📊' },
  'settings':       { label: 'Ayarlar',               icon: '⚙️' },
};

export default function BlockingRulesPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('rules');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    fetch(`${API}/shops`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const list: Shop[] = data.shops ?? data ?? [];
        setShops(list);
        if (list.length > 0) setSelectedShop(list[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '24px 28px',
    marginBottom: 20,
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
        <GeometricBackground /><Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ color: '#6b7280', fontSize: 15 }}>Yükleniyor…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <GeometricBackground />
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>🛡️ Gelişmiş Engelleme</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            IP, desen ve kurallarla şüpheli siparişleri otomatik engelleyin.
          </p>
        </div>

        {shops.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
            <p style={{ color: '#9ca3af', margin: 0 }}>Önce bir mağaza eklemeniz gerekiyor.</p>
          </div>
        )}

        {shops.length > 1 && (
          <div style={{ ...card, padding: '16px 20px' }}>
            <label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Mağaza</label>
            <select value={selectedShop ?? ''} onChange={e => setSelectedShop(Number(e.target.value))}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb', fontSize: 14, padding: '8px 12px', width: '100%' }}>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}{s.shopDomain ? ` — ${s.shopDomain}` : ''}</option>)}
            </select>
          </div>
        )}

        {selectedShop && (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 6, flexWrap: 'wrap' }}>
              {(Object.keys(TAB_LABELS) as Tab[]).map(key => {
                const active = tab === key;
                const info = TAB_LABELS[key];
                return (
                  <button key={key} onClick={() => setTab(key)}
                    style={{
                      flex: '1 1 auto', minWidth: 140,
                      padding: '10px 14px', borderRadius: 8, border: 'none',
                      background: active ? 'rgba(139,92,246,0.2)' : 'transparent',
                      color: active ? '#a78bfa' : '#6b7280',
                      fontWeight: active ? 700 : 400, fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </button>
                );
              })}
            </div>

            {tab === 'rules' && <RulesTab shopId={selectedShop} />}
            {tab === 'blocked-orders' && <BlockedOrdersTab shopId={selectedShop} />}
            {tab === 'stats' && <StatsTab shopId={selectedShop} />}
            {tab === 'settings' && <SettingsTab shopId={selectedShop} />}
          </>
        )}
      </div>
    </div>
  );
}
