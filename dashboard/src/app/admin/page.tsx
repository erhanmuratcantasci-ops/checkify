'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

const API = "https://checkify-production.up.railway.app";

function getToken() {
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

type Section = 'dashboard' | 'users' | 'shops' | 'orders';

interface AdminUser {
  id: number; email: string; name: string | null;
  smsCredits: number; isAdmin: boolean; shopCount: number;
  createdAt: string; lastLoginAt: string | null;
}
interface AdminUserDetail extends AdminUser { orderCount: number; }
interface AdminShop {
  id: number; name: string; shopDomain: string | null; createdAt: string;
  orderCount: number; user: { id: number; email: string; name: string | null };
}
interface AdminShopDetail {
  id: number; name: string; shopDomain: string | null; webhookSecret: string | null;
  smsTemplate: string | null; createdAt: string; orderCount: number;
  user: { id: number; email: string; name: string | null };
  orders: { id: number; customerName: string; total: number; status: string; createdAt: string }[];
}
interface AdminOrder {
  id: number; customerName: string; customerPhone: string;
  total: number; status: string; createdAt: string; shopifyOrderId: string | null;
  shop: { id: number; name: string; shopDomain: string | null; user: { id: number; email: string; name: string | null } };
}
interface AdminOrderDetail extends AdminOrder {
  shop: AdminOrder['shop'] & { webhookSecret?: string | null; smsTemplate?: string | null };
  smsLogs: { id: number; phone: string; message: string; status: string; errorMessage: string | null; createdAt: string }[];
}
interface AdminStats {
  totalUsers: number; totalOrders: number; totalSMSSent: number;
  totalCreditsInSystem: number; ordersByStatus: Record<string, number>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor', CONFIRMED: 'Onaylandı', PREPARING: 'Hazırlanıyor',
  SHIPPED: 'Kargoda', DELIVERED: 'Teslim', CANCELLED: 'İptal',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#fbbf24', CONFIRMED: '#34d399', PREPARING: '#60a5fa',
  SHIPPED: '#818cf8', DELIVERED: '#34d399', CANCELLED: '#f87171',
};
const SMS_STATUS_COLORS: Record<string, string> = {
  SENT: '#34d399', FAILED: '#f87171', PENDING: '#fbbf24',
};

const SECTION_LABELS: Record<Section, string> = {
  dashboard: 'Dashboard', users: 'Kullanıcılar', shops: 'Mağazalar', orders: 'Tüm Siparişler',
};
const NAV_ITEMS: { key: Section; icon: string }[] = [
  { key: 'dashboard', icon: '◈' }, { key: 'users', icon: '👤' },
  { key: 'shops', icon: '🏪' }, { key: 'orders', icon: '📦' },
];

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
  backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 100, padding: 24,
};
const modalBox = (border = 'rgba(255,255,255,0.1)'): React.CSSProperties => ({
  background: 'rgba(13,13,22,0.99)', border: `1px solid ${border}`,
  borderRadius: 20, width: '100%', maxWidth: 500,
  boxShadow: '0 30px 60px rgba(0,0,0,0.7)', position: 'relative',
  maxHeight: '90vh', overflowY: 'auto',
});

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 0' }}>
      <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h2>
      <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#9ca3af', fontSize: 16, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
    </div>
  );
}

function InfoGrid({ items }: { items: { label: string; value: React.ReactNode; color?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{label}</div>
          <div style={{ color: color || '#e5e7eb', fontSize: 15, fontWeight: 700 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#9ca3af';
  return (
    <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}40` }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%', background: `radial-gradient(circle, ${color}30 0%, transparent 70%)` }} />
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{value}</div>
      <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [section, setSection] = useState<Section>('dashboard');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [userSearch, setUserSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  const [creditTarget, setCreditTarget] = useState<AdminUser | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');
  const [creditSaving, setCreditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [detailUser, setDetailUser] = useState<AdminUserDetail | null>(null);
  const [detailUserLoading, setDetailUserLoading] = useState(false);

  const [detailOrder, setDetailOrder] = useState<AdminOrderDetail | null>(null);
  const [detailOrderLoading, setDetailOrderLoading] = useState(false);

  const [detailShop, setDetailShop] = useState<AdminShopDetail | null>(null);
  const [detailShopLoading, setDetailShopLoading] = useState(false);

  const [togglingAdmin, setTogglingAdmin] = useState<number | null>(null);

  useEffect(() => { void (async () => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }

    let meData: { user?: { isAdmin?: boolean } } = {};
    try {
      const meRes = await fetch(`${API}/auth/me`, { headers: authHeaders() });
      meData = await meRes.json();
    } catch { return; }
    if (meData.user && meData.user.isAdmin === false) { router.push('/dashboard'); return; }

    Promise.all([
      fetch(`${API}/admin/users`, { headers: authHeaders() }),
      fetch(`${API}/admin/stats`, { headers: authHeaders() }),
      fetch(`${API}/admin/shops`, { headers: authHeaders() }),
      fetch(`${API}/admin/orders`, { headers: authHeaders() }),
    ]).then(async ([uRes, sRes, shRes, oRes]) => {
      if (uRes.status === 403 || uRes.status === 401) { router.push('/dashboard'); return; }
      const [uData, sData, shData, oData] = await Promise.all([uRes.json(), sRes.json(), shRes.json(), oRes.json()]);
      setUsers(uData.users || []);
      setStats(sData);
      setShops(shData.shops || []);
      setOrders(oData.orders || []);
    }).catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  })(); }, [router]);

  async function handleAddCredits(e: React.FormEvent) {
    e.preventDefault();
    if (!creditTarget) return;
    const amount = parseInt(creditAmount);
    if (!amount || isNaN(amount)) { showToast('Geçerli bir miktar girin', 'error'); return; }
    setCreditSaving(true);
    try {
      const res = await fetch(`${API}/admin/users/${creditTarget.id}/credits`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ amount, description: creditDesc || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata oluştu');
      setUsers(prev => prev.map(u => u.id === creditTarget.id ? { ...u, smsCredits: data.user.smsCredits } : u));
      showToast(`${amount > 0 ? '+' : ''}${amount} kredi yüklendi`, 'success');
      setCreditTarget(null); setCreditAmount(''); setCreditDesc('');
    } catch (err) { showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error'); }
    finally { setCreditSaving(false); }
  }

  async function handleToggleAdmin(user: AdminUser) {
    setTogglingAdmin(user.id);
    try {
      const res = await fetch(`${API}/admin/users/${user.id}`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata oluştu');
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isAdmin: data.user.isAdmin } : u));
      showToast(`${user.email} ${data.user.isAdmin ? 'admin yapıldı' : 'admin yetkisi kaldırıldı'}`, 'success');
    } catch (err) { showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error'); }
    finally { setTogglingAdmin(null); }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/admin/users/${deleteTarget.id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata oluştu');
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      showToast('Kullanıcı silindi', 'success');
      setDeleteTarget(null);
    } catch (err) { showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error'); }
    finally { setDeleting(false); }
  }

  async function openUserDetail(user: AdminUser) {
    setDetailUserLoading(true); setDetailUser(null);
    try {
      const res = await fetch(`${API}/admin/users/${user.id}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetailUser(data.user);
    } catch (err) { showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error'); setDetailUserLoading(false); }
    finally { setDetailUserLoading(false); }
  }

  async function openOrderDetail(order: AdminOrder) {
    setDetailOrderLoading(true); setDetailOrder(null);
    try {
      const res = await fetch(`${API}/admin/orders/${order.id}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetailOrder(data.order);
    } catch (err) { showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error'); setDetailOrderLoading(false); }
    finally { setDetailOrderLoading(false); }
  }

  async function openShopDetail(shop: AdminShop) {
    setDetailShopLoading(true); setDetailShop(null);
    try {
      const res = await fetch(`${API}/admin/shops/${shop.id}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetailShop(data.shop);
    } catch (err) { showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error'); setDetailShopLoading(false); }
    finally { setDetailShopLoading(false); }
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredOrders = orders.filter(o =>
    o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.customerPhone.includes(orderSearch) ||
    o.shop.name.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const sidebarW = 240;
  const accent = '#991b1b';
  const accentLight = 'rgba(153,27,27,0.18)';
  const accentBorder = 'rgba(153,27,27,0.4)';

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280', fontSize: 14 }}>Yükleniyor...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`nav, header > nav { display: none !important; } ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}`}</style>

      {/* ── Sidebar ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: sidebarW, height: '100vh', background: '#0d0d14', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${accent}, #b91c1c)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>C</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>Chekkify</div>
              <div style={{ display: 'inline-block', background: accentLight, border: `1px solid ${accentBorder}`, borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Admin</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px' }}>
          {NAV_ITEMS.map(({ key, icon }) => {
            const active = section === key;
            return (
              <button key={key} onClick={() => setSection(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, background: active ? accentLight : 'transparent', border: active ? `1px solid ${accentBorder}` : '1px solid transparent', color: active ? '#fca5a5' : '#6b7280', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                <span style={{ fontSize: 15 }}>{icon}</span>{SECTION_LABELS[key]}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => { document.cookie = 'token=; path=/; max-age=0'; router.push('/login'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'transparent', border: '1px solid transparent', color: '#4b5563', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
            <span>🚪</span> Çıkış
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ marginLeft: sidebarW, minHeight: '100vh' }}>
        <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(13,13,20,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>{SECTION_LABELS[section]}</h1>
          <div style={{ color: '#4b5563', fontSize: 12 }}>{users.length} kullanıcı · {orders.length} sipariş</div>
        </div>

        <div style={{ padding: '32px' }}>

          {/* ── DASHBOARD ── */}
          {section === 'dashboard' && stats && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
                <StatCard label="Toplam Kullanıcı" value={stats.totalUsers} icon="👤" color="#7c3aed" />
                <StatCard label="Toplam Sipariş" value={stats.totalOrders} icon="📦" color="#0891b2" />
                <StatCard label="SMS Gönderildi" value={stats.totalSMSSent} icon="📱" color="#059669" />
                <StatCard label="Sistemdeki Kredi" value={stats.totalCreditsInSystem} icon="💳" color="#d97706" />
              </div>
              {Object.keys(stats.ordersByStatus).length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                  {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                    <div key={status} style={{ textAlign: 'center' }}>
                      <div style={{ color: STATUS_COLORS[status] || '#e5e7eb', fontSize: 22, fontWeight: 800 }}>{count}</div>
                      <div style={{ color: '#4b5563', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{STATUS_LABELS[status] || status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── USERS ── */}
          {section === 'users' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <input type="text" placeholder="Email veya isme göre ara..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb', outline: 'none', width: 300 }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Kullanıcı', 'Email', 'Kredi', 'Mağaza', 'Kayıt', 'Rol', ''].map((h, i) => (
                        <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: '#4b5563', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, i) => (
                      <tr key={user.id} style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => openUserDetail(user)}>
                            <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                              {(user.name || user.email).slice(0, 2).toUpperCase()}
                            </div>
                            <div style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 500, textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{user.name || '—'}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>{user.email}</td>
                        <td style={{ padding: '12px 16px' }}><span style={{ color: user.smsCredits === 0 ? '#f87171' : user.smsCredits < 10 ? '#fbbf24' : '#34d399', fontSize: 13, fontWeight: 700 }}>{user.smsCredits}</span></td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>{user.shopCount}</td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 11 }}>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => handleToggleAdmin(user)} disabled={togglingAdmin === user.id} style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: togglingAdmin === user.id ? 'not-allowed' : 'pointer', background: user.isAdmin ? accentLight : 'rgba(255,255,255,0.04)', border: `1px solid ${user.isAdmin ? accentBorder : 'rgba(255,255,255,0.08)'}`, color: user.isAdmin ? '#fca5a5' : '#4b5563' }}>
                            {togglingAdmin === user.id ? '...' : user.isAdmin ? '🛡️ Admin' : 'Kullanıcı'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setCreditTarget(user); setCreditAmount(''); setCreditDesc(''); }} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)', color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap' }}>Kredi</button>
                            <button onClick={() => setDeleteTarget(user)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', cursor: 'pointer' }}>Sil</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>Sonuç bulunamadı</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SHOPS ── */}
          {section === 'shops' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Mağaza', 'Domain', 'Sahip', 'Sipariş', 'Kayıt'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: '#4b5563', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shops.map((shop, i) => (
                    <tr key={shop.id} onClick={() => openShopDetail(shop)} style={{ borderBottom: i < shops.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg, #0891b2, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{shop.name.slice(0, 2).toUpperCase()}</div>
                          <div style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 500 }}>{shop.name}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>{shop.shopDomain || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ color: '#9ca3af', fontSize: 12 }}>{shop.user.name || shop.user.email}</div>
                        {shop.user.name && <div style={{ color: '#4b5563', fontSize: 11 }}>{shop.user.email}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#e5e7eb', fontSize: 13, fontWeight: 600 }}>{shop.orderCount}</td>
                      <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 11 }}>{new Date(shop.createdAt).toLocaleDateString('tr-TR')}</td>
                    </tr>
                  ))}
                  {shops.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>Henüz mağaza yok</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── ORDERS ── */}
          {section === 'orders' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <input type="text" placeholder="Müşteri adı, telefon veya mağaza..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb', outline: 'none', width: 320 }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['#', 'Müşteri', 'Telefon', 'Tutar', 'Durum', 'Mağaza', 'Tarih'].map((h, i) => (
                        <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: '#4b5563', fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, i) => (
                      <tr key={order.id} onClick={() => openOrderDetail(order)} style={{ borderBottom: i < filteredOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: 12 }}>#{order.id}</td>
                        <td style={{ padding: '12px 16px', color: '#e5e7eb', fontSize: 13 }}>{order.customerName}</td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>{order.customerPhone}</td>
                        <td style={{ padding: '12px 16px', color: '#e5e7eb', fontSize: 13, fontWeight: 600 }}>{order.total.toFixed(2)} ₺</td>
                        <td style={{ padding: '12px 16px' }}><StatusBadge status={order.status} /></td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ color: '#9ca3af', fontSize: 12 }}>{order.shop.name}</div>
                          <div style={{ color: '#4b5563', fontSize: 11 }}>{order.shop.user.email}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 11 }}>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>Sonuç bulunamadı</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Credit Modal ── */}
      {creditTarget && (
        <div onClick={() => setCreditTarget(null)} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={modalBox('rgba(5,150,105,0.25)')}>
            <ModalHeader title="Kredi Yükle" onClose={() => setCreditTarget(null)} />
            <div style={{ padding: '16px 28px 28px' }}>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 20px' }}>
                {creditTarget.name || creditTarget.email} — mevcut: <strong style={{ color: '#e5e7eb' }}>{creditTarget.smsCredits}</strong>
              </p>
              <form onSubmit={handleAddCredits} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Miktar <span style={{ color: '#4b5563' }}>(negatif değer düşer)</span></label>
                  <input type="number" required value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="100" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Açıklama (opsiyonel)</label>
                  <input type="text" value={creditDesc} onChange={e => setCreditDesc(e.target.value)} placeholder="Kampanya kredisi" style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={creditSaving} style={{ flex: 1, padding: '12px', background: creditSaving ? 'rgba(5,150,105,0.3)' : 'linear-gradient(135deg, #059669, #10b981)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: creditSaving ? 'not-allowed' : 'pointer' }}>{creditSaving ? 'Yükleniyor...' : 'Yükle'}</button>
                  <button type="button" onClick={() => setCreditTarget(null)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9ca3af', fontSize: 14, cursor: 'pointer' }}>İptal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <div onClick={() => !deleting && setDeleteTarget(null)} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={modalBox('rgba(239,68,68,0.25)')}>
            <ModalHeader title="Kullanıcıyı Sil" onClose={() => !deleting && setDeleteTarget(null)} />
            <div style={{ padding: '16px 28px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
                <strong style={{ color: '#e5e7eb' }}>{deleteTarget.name || deleteTarget.email}</strong> hesabını silmek istediğinden emin misin? Bu işlem geri alınamaz.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleDeleteUser} disabled={deleting} style={{ flex: 1, padding: '12px', background: deleting ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}>{deleting ? 'Siliniyor...' : 'Sil'}</button>
                <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9ca3af', fontSize: 14, cursor: 'pointer' }}>İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── User Detail Modal ── */}
      {(detailUserLoading || detailUser) && (
        <div onClick={() => { setDetailUser(null); setDetailUserLoading(false); }} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={modalBox('rgba(139,92,246,0.25)')}>
            <ModalHeader title="Kullanıcı Detayı" onClose={() => { setDetailUser(null); setDetailUserLoading(false); }} />
            <div style={{ padding: '20px 28px 28px' }}>
              {detailUserLoading ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>Yükleniyor...</div>
              ) : detailUser && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {(detailUser.name || detailUser.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{detailUser.name || '—'}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>{detailUser.email}</div>
                    </div>
                    {detailUser.isAdmin && <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: accentLight, border: `1px solid ${accentBorder}`, color: '#fca5a5' }}>🛡️ Admin</span>}
                  </div>
                  <InfoGrid items={[
                    { label: 'SMS Kredisi', value: detailUser.smsCredits, color: detailUser.smsCredits === 0 ? '#f87171' : detailUser.smsCredits < 10 ? '#fbbf24' : '#34d399' },
                    { label: 'Mağaza Sayısı', value: detailUser.shopCount },
                    { label: 'Sipariş Sayısı', value: detailUser.orderCount },
                    { label: 'Kayıt Tarihi', value: new Date(detailUser.createdAt).toLocaleDateString('tr-TR'), color: '#9ca3af' },
                  ]} />
                  <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Son Giriş</div>
                    <div style={{ color: '#9ca3af', fontSize: 13 }}>{detailUser.lastLoginAt ? new Date(detailUser.lastLoginAt).toLocaleString('tr-TR') : 'Henüz giriş yapılmadı'}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      {(detailOrderLoading || detailOrder) && (
        <div onClick={() => { setDetailOrder(null); setDetailOrderLoading(false); }} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={{ ...modalBox('rgba(96,165,250,0.25)'), maxWidth: 560 }}>
            <ModalHeader title={`Sipariş #${detailOrder?.id || ''}`} onClose={() => { setDetailOrder(null); setDetailOrderLoading(false); }} />
            <div style={{ padding: '20px 28px 28px' }}>
              {detailOrderLoading ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>Yükleniyor...</div>
              ) : detailOrder && (
                <>
                  <InfoGrid items={[
                    { label: 'Müşteri', value: detailOrder.customerName },
                    { label: 'Telefon', value: detailOrder.customerPhone, color: '#9ca3af' },
                    { label: 'Tutar', value: `${detailOrder.total.toFixed(2)} ₺`, color: '#34d399' },
                    { label: 'Durum', value: <StatusBadge status={detailOrder.status} /> },
                    { label: 'Mağaza', value: detailOrder.shop.name },
                    { label: 'Sahip', value: detailOrder.shop.user.email, color: '#6b7280' },
                    { label: 'Tarih', value: new Date(detailOrder.createdAt).toLocaleString('tr-TR'), color: '#9ca3af' },
                    { label: 'Shopify ID', value: detailOrder.shopifyOrderId ? `#${detailOrder.shopifyOrderId}` : '—', color: '#6b7280' },
                  ]} />
                  {detailOrder.smsLogs.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>SMS Logları ({detailOrder.smsLogs.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {detailOrder.smsLogs.map(log => (
                          <div key={log.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ color: SMS_STATUS_COLORS[log.status] || '#9ca3af', fontSize: 11, fontWeight: 700 }}>{log.status}</span>
                              <span style={{ color: '#4b5563', fontSize: 10 }}>{new Date(log.createdAt).toLocaleString('tr-TR')}</span>
                            </div>
                            <div style={{ color: '#6b7280', fontSize: 11, lineHeight: 1.5 }}>{log.message}</div>
                            {log.errorMessage && <div style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>Hata: {log.errorMessage}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {detailOrder.smsLogs.length === 0 && (
                    <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', color: '#4b5563', fontSize: 13, textAlign: 'center' }}>
                      SMS logu yok
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Shop Detail Modal ── */}
      {(detailShopLoading || detailShop) && (
        <div onClick={() => { setDetailShop(null); setDetailShopLoading(false); }} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={{ ...modalBox('rgba(6,182,212,0.25)'), maxWidth: 540 }}>
            <ModalHeader title="Mağaza Detayı" onClose={() => { setDetailShop(null); setDetailShopLoading(false); }} />
            <div style={{ padding: '20px 28px 28px' }}>
              {detailShopLoading ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>Yükleniyor...</div>
              ) : detailShop && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #0891b2, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {detailShop.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{detailShop.name}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>{detailShop.shopDomain || 'Domain yok'}</div>
                    </div>
                  </div>
                  <InfoGrid items={[
                    { label: 'Toplam Sipariş', value: detailShop.orderCount, color: '#60a5fa' },
                    { label: 'Sahip', value: detailShop.user.email, color: '#9ca3af' },
                    { label: 'Kayıt Tarihi', value: new Date(detailShop.createdAt).toLocaleDateString('tr-TR'), color: '#9ca3af' },
                    { label: 'Sahip Adı', value: detailShop.user.name || '—', color: '#e5e7eb' },
                  ]} />
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Webhook Secret</div>
                      <div style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>{detailShop.webhookSecret || '—'}</div>
                    </div>
                    <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>SMS Şablonu</div>
                      <div style={{ color: '#9ca3af', fontSize: 12, lineHeight: 1.5 }}>{detailShop.smsTemplate || 'Varsayılan şablon'}</div>
                    </div>
                  </div>
                  {detailShop.orders.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Son Siparişler</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {detailShop.orders.map(o => (
                          <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <span style={{ color: '#4b5563', fontSize: 11 }}>#{o.id}</span>
                              <span style={{ color: '#e5e7eb', fontSize: 12, marginLeft: 8 }}>{o.customerName}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ color: '#34d399', fontSize: 12, fontWeight: 600 }}>{o.total.toFixed(2)} ₺</span>
                              <StatusBadge status={o.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
