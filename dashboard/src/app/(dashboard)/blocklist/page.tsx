'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GeometricBackground from '@/components/GeometricBackground';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  if (typeof window === 'undefined') return null;
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}

interface Shop { id: number; name: string; shopDomain: string | null; }
interface BlockedPhone { id: number; phone: string; reason: string | null; createdAt: string; }
interface BlockedPostal { id: number; postalCode: string; reason: string | null; createdAt: string; }
type Tab = 'phone' | 'postal';

export default function BlocklistPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('phone');
  const [phones, setPhones] = useState<BlockedPhone[]>([]);
  const [postals, setPostals] = useState<BlockedPostal[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [addValue, setAddValue] = useState('');
  const [addReason, setAddReason] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [planError, setPlanError] = useState(false);

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

  const fetchList = useCallback(() => {
    if (!selectedShop) return;
    const token = getToken();
    setListLoading(true);
    const endpoint = tab === 'phone'
      ? `/shops/${selectedShop}/blocked-phones`
      : `/shops/${selectedShop}/blocked-postal-codes`;
    fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (tab === 'phone') setPhones(data.blocked ?? []);
        else setPostals(data.blocked ?? []);
        setListLoading(false);
      })
      .catch(() => setListLoading(false));
  }, [selectedShop, tab]);

  useEffect(() => { fetchList(); }, [fetchList]);

  async function handleAdd() {
    if (!addValue.trim() || !selectedShop) return;
    const token = getToken();
    setAddLoading(true);
    setError(''); setSuccess(''); setPlanError(false);
    const endpoint = tab === 'phone'
      ? `/shops/${selectedShop}/blocked-phones`
      : `/shops/${selectedShop}/blocked-postal-codes`;
    const body = tab === 'phone'
      ? { phone: addValue.trim(), reason: addReason.trim() || null }
      : { postalCode: addValue.trim(), reason: addReason.trim() || null };
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) setPlanError(true);
        else setError(data.error ?? 'Bir hata oluştu');
      } else {
        setAddValue(''); setAddReason('');
        setSuccess(tab === 'phone' ? 'Numara engellendi.' : 'Posta kodu engellendi.');
        fetchList();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch { setError('Bağlantı hatası'); }
    setAddLoading(false);
  }

  async function handleDelete(value: string) {
    if (!selectedShop) return;
    const token = getToken();
    const endpoint = tab === 'phone'
      ? `/shops/${selectedShop}/blocked-phones/${encodeURIComponent(value)}`
      : `/shops/${selectedShop}/blocked-postal-codes/${encodeURIComponent(value)}`;
    await fetch(`${API}${endpoint}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchList();
  }

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: '24px 28px', marginBottom: 20,
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <GeometricBackground />      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ color: '#6b7280', fontSize: 15 }}>Yükleniyor…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <GeometricBackground />      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>🚫 Engel Listesi</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            Belirli telefon numaralarını veya posta kodlarını COD doğrulamasından hariç tutun.
          </p>
        </div>

        {shops.length > 1 && (
          <div style={{ ...card, padding: '16px 20px' }}>
            <label style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, display: 'block' }}>Mağaza</label>
            <select value={selectedShop ?? ''} onChange={e => setSelectedShop(Number(e.target.value))}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb', fontSize: 14, padding: '8px 12px', width: '100%' }}>
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}{s.shopDomain ? ` — ${s.shopDomain}` : ''}</option>)}
            </select>
          </div>
        )}

        {shops.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
            <p style={{ color: '#9ca3af', margin: 0 }}>Önce bir mağaza eklemeniz gerekiyor.</p>
          </div>
        )}

        {selectedShop && (
          <>
            {planError && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <div>
                  <p style={{ color: '#f87171', fontWeight: 700, margin: '0 0 2px', fontSize: 14 }}>PRO Plan Gerekli</p>
                  <p style={{ color: '#9ca3af', margin: 0, fontSize: 13 }}>
                    Engel listesi özelliği PRO ve üzeri planlarda kullanılabilir.{' '}
                    <a href="/pricing" style={{ color: '#a78bfa', textDecoration: 'none' }}>Planı yükselt →</a>
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 6 }}>
              {(['phone', 'postal'] as Tab[]).map(key => (
                <button key={key} onClick={() => { setTab(key); setError(''); setPlanError(false); }}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: tab === key ? 'rgba(139,92,246,0.2)' : 'transparent', color: tab === key ? '#a78bfa' : '#6b7280', fontWeight: tab === key ? 700 : 400, fontSize: 14, cursor: 'pointer' }}>
                  {key === 'phone' ? '📱 Telefon Numaraları' : '📍 Posta Kodları'}
                </button>
              ))}
            </div>

            <div style={card}>
              <h3 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>
                {tab === 'phone' ? 'Numara Engelle' : 'Posta Kodu Engelle'}
              </h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <input type="text" placeholder={tab === 'phone' ? '+90 5xx xxx xx xx' : '34000'} value={addValue}
                  onChange={e => setAddValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  style={{ flex: 1, minWidth: 140, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb', fontSize: 14, padding: '10px 14px' }} />
                <input type="text" placeholder="Sebep (opsiyonel)" value={addReason}
                  onChange={e => setAddReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  style={{ flex: 1, minWidth: 140, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e5e7eb', fontSize: 14, padding: '10px 14px' }} />
                <button onClick={handleAdd} disabled={addLoading || !addValue.trim()}
                  style={{ background: addLoading || !addValue.trim() ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, padding: '10px 20px', cursor: addLoading || !addValue.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                  {addLoading ? '…' : '+ Ekle'}
                </button>
              </div>
              {error && <p style={{ color: '#f87171', fontSize: 13, margin: '6px 0 0' }}>⚠ {error}</p>}
              {success && <p style={{ color: '#34d399', fontSize: 13, margin: '6px 0 0' }}>✓ {success}</p>}
            </div>

            <div style={card}>
              <h3 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>
                {tab === 'phone' ? 'Engellenen Numaralar' : 'Engellenen Posta Kodları'}{' '}
                <span style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: '#a78bfa' }}>
                  {tab === 'phone' ? phones.length : postals.length}
                </span>
              </h3>

              {listLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280', fontSize: 14 }}>Yükleniyor…</div>
              ) : (tab === 'phone' ? phones : postals).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>
                    {tab === 'phone' ? 'Engellenen numara yok.' : 'Engellenen posta kodu yok.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(tab === 'phone' ? phones : postals).map((item: BlockedPhone | BlockedPostal) => {
                    const value = tab === 'phone' ? (item as BlockedPhone).phone : (item as BlockedPostal).postalCode;
                    return (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px' }}>
                        <div>
                          <span style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 14 }}>{value}</span>
                          {item.reason && <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 10 }}>— {item.reason}</span>}
                          <div style={{ color: '#4b5563', fontSize: 11, marginTop: 2 }}>
                            {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                        <button onClick={() => handleDelete(value)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: 12, fontWeight: 600, padding: '6px 12px', cursor: 'pointer' }}>
                          Kaldır
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}