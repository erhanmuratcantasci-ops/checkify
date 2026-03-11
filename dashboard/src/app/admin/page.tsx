'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useIsMobile } from '@/hooks/useIsMobile';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://checkify-production.up.railway.app';

function getAdminToken() {
  const entry = document.cookie.split('; ').find(r => r.startsWith('adminToken='));
  return entry ? entry.slice('adminToken='.length) : null;
}
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` };
}

type Section = 'dashboard' | 'users' | 'shops' | 'orders' | 'security';

interface AdminUser {
  id: number; email: string; name: string | null;
  smsCredits: number; whatsappCredits: number; isAdmin: boolean; shopCount: number;
  createdAt: string; lastLoginAt: string | null; plan?: string;
}
interface AdminUserDetail extends AdminUser {
  orderCount: number;
  billingCycle?: string;
  planExpiresAt?: string | null;
}
interface AdminTransaction {
  id: number; amount: number; type: string; description: string; price?: number; createdAt: string;
}
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
interface SecurityLog {
  id: number;
  ip: string;
  endpoint: string;
  reason: string;
  createdAt: string;
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
  dashboard: 'Dashboard', users: 'Kullanıcılar', shops: 'Mağazalar', orders: 'Siparişler', security: 'Güvenlik Logları',
};
const NAV_ITEMS: { key: Section; icon: string }[] = [
  { key: 'dashboard', icon: '◈' }, { key: 'users', icon: '👤' },
  { key: 'shops', icon: '🏪' }, { key: 'orders', icon: '📦' },
  { key: 'security', icon: '🔒' },
];

const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
  backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 100, padding: 16,
};
const modalBox = (border = 'rgba(255,255,255,0.1)'): React.CSSProperties => ({
  background: 'rgba(13,13,22,0.99)', border: `1px solid ${border}`,
  borderRadius: 20, width: '100%', maxWidth: 500,
  boxShadow: '0 30px 60px rgba(0,0,0,0.7)', position: 'relative',
  maxHeight: '90vh', overflowY: 'auto',
});

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0' }}>
      <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
      <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#9ca3af', fontSize: 16, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
    </div>
  );
}

function InfoGrid({ items }: { items: { label: string; value: React.ReactNode; color?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
          <div style={{ color: color || '#e5e7eb', fontSize: 14, fontWeight: 700 }}>{value}</div>
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

const PLAN_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  FREE:     { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' },
  STARTER:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)'  },
  PRO:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  BUSINESS: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
};
function PlanBadge({ plan }: { plan: string }) {
  const c = PLAN_COLORS[plan] || PLAN_COLORS['FREE'];
  return (
    <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.border}`, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
      {plan}
    </span>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%', background: `radial-gradient(circle, ${color}30 0%, transparent 70%)` }} />
      <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{value}</div>
      <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [section, setSection] = useState<Section>('dashboard');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [userSearch, setUserSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  const [creditTarget, setCreditTarget] = useState<AdminUser | null>(null);
  const [creditSmsAmt, setCreditSmsAmt] = useState('');
  const [creditWpAmt, setCreditWpAmt] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [creditSmsSaving, setCreditSmsSaving] = useState(false);
  const [creditWpSaving, setCreditWpSaving] = useState(false);
  const [detailUserTransactions, setDetailUserTransactions] = useState<AdminTransaction[]>([]);

  const [detailPlanValue, setDetailPlanValue] = useState('FREE');
  const [detailCycleValue, setDetailCycleValue] = useState('monthly');
  const [detailExpiresValue, setDetailExpiresValue] = useState('');
  const [detailPlanSaving, setDetailPlanSaving] = useState(false);

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
    const token = getAdminToken();
    if (!token) { router.push('/admin/login'); return; }

    // Verify admin token — only redirect on explicit 401/403, not on network errors
    try {
      const meRes = await fetch(`${API}/admin-auth/me`, { headers: authHeaders() });
      if (meRes.status === 401 || meRes.status === 403) {
        router.push('/admin/login'); return;
      }
    } catch (e) {
      // Network error or Railway down — log and continue, token might still be valid
      console.warn('[admin] /admin-auth/me unreachable, proceeding with stored token', e);
    }

    Promise.all([
      fetch(`${API}/admin/users`, { headers: authHeaders() }),
      fetch(`${API}/admin/stats`, { headers: authHeaders() }),
      fetch(`${API}/admin/shops`, { headers: authHeaders() }),
      fetch(`${API}/admin/orders`, { headers: authHeaders() }),
      fetch(`${API}/admin/security-logs`, { headers: authHeaders() }),
    ]).then(async ([uRes, sRes, shRes, oRes, secRes]) => {
      // Only redirect to login on auth failure, not other errors
      if (uRes.status === 401 || uRes.status === 403) { router.push('/admin/login'); return; }
      const [uData, sData, shData, oData, secData] = await Promise.all([uRes.json(), sRes.json(), shRes.json(), oRes.json(), secRes.json()]);
      setUsers(uData.users || []);
      setStats(sData);
      setShops(shData.shops || []);
      setOrders(oData.orders || []);
      setSecurityLogs(secData.logs ?? []);
    }).catch(e => console.error('[admin] data fetch error', e))
      .finally(() => setLoading(false));
  })(); }, [router]);

  async function handleAddCredit(type: 'sms' | 'whatsapp') {
    if (!creditTarget) return;
    const rawAmt = type === 'sms' ? creditSmsAmt : creditWpAmt;
    const amount = parseInt(rawAmt);
    if (!rawAmt || isNaN(amount) || amount === 0) { showToast('Geçerli bir miktar girin', 'error'); return; }
    if (type === 'sms') setCreditSmsSaving(true); else setCreditWpSaving(true);
    try {
      const res = await fetch(`${API}/admin/users/${creditTarget.id}/credits`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ amount, creditType: type, description: creditNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata oluştu');
      setUsers(prev => prev.map(u => u.id === creditTarget!.id ? { ...u, smsCredits: data.user.smsCredits, whatsappCredits: data.user.whatsappCredits } : u));
      setCreditTarget(prev => prev ? { ...prev, smsCredits: data.user.smsCredits, whatsappCredits: data.user.whatsappCredits } : prev);
      if (type === 'sms') setCreditSmsAmt(''); else setCreditWpAmt('');
      showToast(`${amount > 0 ? '+' : ''}${amount} ${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} kredi güncellendi`, 'success');
    } catch (err) {
      console.error('[credit]', err);
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
    } finally {
      if (type === 'sms') setCreditSmsSaving(false); else setCreditWpSaving(false);
    }
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
    setDetailUserLoading(true); setDetailUser(null); setDetailUserTransactions([]);
    try {
      const res = await fetch(`${API}/admin/users/${parseInt(String(user.id))}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetailUser(data.user);
      setDetailUserTransactions(data.transactions || []);
      setDetailPlanValue(data.user.plan ?? 'FREE');
      setDetailCycleValue(data.user.billingCycle ?? 'monthly');
      setDetailExpiresValue(data.user.planExpiresAt ? new Date(data.user.planExpiresAt).toISOString().slice(0, 10) : '');
    } catch (err) { showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error'); setDetailUserLoading(false); }
    finally { setDetailUserLoading(false); }
  }

  async function handleUpdatePlan() {
    if (!detailUser) return;
    const token = getAdminToken();
    console.log('[plan] token present:', !!token, '| user:', detailUser.id, '| plan:', detailPlanValue);
    setDetailPlanSaving(true);
    try {
      const res = await fetch(`${API}/admin/users/${detailUser.id}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: detailPlanValue, billingCycle: detailCycleValue, expiresAt: detailExpiresValue || null }),
      });
      let data: { error?: string; user?: { plan: string } } = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      console.log('[plan] response:', res.status, data);
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setDetailUser(prev => prev ? { ...prev, plan: data.user!.plan } : prev);
      setUsers(prev => prev.map(u => u.id === detailUser.id ? { ...u, plan: data.user!.plan } : u));
      showToast(`Plan ${data.user!.plan} olarak güncellendi`, 'success');
    } catch (err) {
      console.error('[plan] error:', err);
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
    } finally { setDetailPlanSaving(false); }
  }

  async function openOrderDetail(order: AdminOrder) {
    setDetailOrderLoading(true); setDetailOrder(null);
    try {
      const res = await fetch(`${API}/admin/orders/${parseInt(String(order.id))}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetailOrder(data.order);
    } catch (err) { showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error'); setDetailOrderLoading(false); }
    finally { setDetailOrderLoading(false); }
  }

  async function openShopDetail(shop: AdminShop) {
    setDetailShopLoading(true); setDetailShop(null);
    try {
      const res = await fetch(`${API}/admin/shops/${parseInt(String(shop.id))}`, { headers: authHeaders() });
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

  const accent = '#991b1b';
  const accentLight = 'rgba(153,27,27,0.18)';
  const accentBorder = 'rgba(153,27,27,0.4)';
  const sidebarW = 240;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#e5e7eb', outline: 'none', boxSizing: 'border-box', minHeight: 44,
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280', fontSize: 14 }}>Yükleniyor...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif" }}>
      <style>{`::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}`}</style>

      {isMobile ? (
        /* ── Mobile layout ── */
        <div>
          {/* Top bar */}
          <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(13,13,20,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${accent}, #b91c1c)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>C</div>
              <div style={{ display: 'inline-block', background: accentLight, border: `1px solid ${accentBorder}`, borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Admin</div>
            </div>
            <button onClick={() => { document.cookie = 'adminToken=; path=/; max-age=0'; router.push('/admin/login'); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 12px', color: '#6b7280', fontSize: 12, cursor: 'pointer' }}>
              Çıkış
            </button>
          </div>

          {/* Tab menu */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', background: '#0d0d14' }}>
            {NAV_ITEMS.map(({ key, icon }) => {
              const active = section === key;
              return (
                <button key={key} onClick={() => setSection(key)} style={{
                  flex: '1 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '10px 8px', fontSize: 10, fontWeight: active ? 700 : 400,
                  color: active ? '#fca5a5' : '#6b7280',
                  background: 'transparent', border: 'none',
                  borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 64, minHeight: 56,
                }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span>{SECTION_LABELS[key]}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ padding: '16px' }}>
            {renderContent()}
          </div>
        </div>
      ) : (
        /* ── Desktop layout ── */
        <div>
          {/* Sidebar */}
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
                  <button key={key} onClick={() => setSection(key)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, background: active ? accentLight : 'transparent', border: active ? `1px solid ${accentBorder}` : '1px solid transparent', color: active ? '#fca5a5' : '#6b7280', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ fontSize: 15 }}>{icon}</span>{SECTION_LABELS[key]}
                  </button>
                );
              })}
            </nav>
            <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => { document.cookie = 'adminToken=; path=/; max-age=0'; router.push('/admin/login'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'transparent', border: '1px solid transparent', color: '#4b5563', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                <span>🚪</span> Çıkış
              </button>
            </div>
          </div>

          {/* Main */}
          <div style={{ marginLeft: sidebarW, minHeight: '100vh' }}>
            <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(13,13,20,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>{SECTION_LABELS[section]}</h1>
              <div style={{ color: '#4b5563', fontSize: 12 }}>{users.length} kullanıcı · {orders.length} sipariş</div>
            </div>
            <div style={{ padding: '32px' }}>
              {renderContent()}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}

      {deleteTarget && (
        <div onClick={() => !deleting && setDeleteTarget(null)} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={modalBox('rgba(239,68,68,0.25)')}>
            <ModalHeader title="Kullanıcıyı Sil" onClose={() => !deleting && setDeleteTarget(null)} />
            <div style={{ padding: '14px 20px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
                <strong style={{ color: '#e5e7eb' }}>{deleteTarget.name || deleteTarget.email}</strong> hesabını silmek istediğinden emin misin?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleDeleteUser} disabled={deleting} style={{ flex: 1, padding: '12px', background: deleting ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', minHeight: 44 }}>{deleting ? 'Siliniyor...' : 'Sil'}</button>
                <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9ca3af', fontSize: 14, cursor: 'pointer', minHeight: 44 }}>İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(detailUserLoading || detailUser) && (
        <div onClick={() => { setDetailUser(null); setDetailUserLoading(false); }} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={modalBox('rgba(139,92,246,0.25)')}>
            <ModalHeader title="Kullanıcı Detayı" onClose={() => { setDetailUser(null); setDetailUserLoading(false); }} />
            <div style={{ padding: '16px 20px 20px' }}>
              {detailUserLoading ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>Yükleniyor...</div>
              ) : detailUser && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {(detailUser.name || detailUser.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{detailUser.name || '—'}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>{detailUser.email}</div>
                    </div>
                    {detailUser.isAdmin && <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: accentLight, border: `1px solid ${accentBorder}`, color: '#fca5a5' }}>🛡️ Admin</span>}
                  </div>
                  <InfoGrid items={[
                    { label: 'SMS Kredisi', value: detailUser.smsCredits, color: detailUser.smsCredits === 0 ? '#f87171' : detailUser.smsCredits < 10 ? '#fbbf24' : '#34d399' },
                    { label: 'WP Kredisi', value: detailUser.whatsappCredits, color: detailUser.whatsappCredits === 0 ? '#f87171' : '#4ade80' },
                    { label: 'Mağaza', value: detailUser.shopCount },
                    { label: 'Sipariş', value: detailUser.orderCount },
                    { label: 'Plan', value: detailUser.plan ?? 'FREE', color: '#a78bfa' },
                    { label: 'Kayıt', value: new Date(detailUser.createdAt).toLocaleDateString('tr-TR'), color: '#9ca3af' },
                  ]} />
                  <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Son Giriş</div>
                    <div style={{ color: '#9ca3af', fontSize: 13 }}>{detailUser.lastLoginAt ? new Date(detailUser.lastLoginAt).toLocaleString('tr-TR') : 'Henüz giriş yapılmadı'}</div>
                  </div>

                  {/* Plan Yönetimi */}
                  <div style={{ marginTop: 14, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '14px' }}>
                    <div style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Plan Yönetimi</div>
                    {/* Plan kartları */}
                    {(() => {
                      const planCards = [
                        { key: 'FREE',     label: 'Free',     price: 'Ücretsiz', desc: '100 SMS/ay · 1 mağaza · Temel OTP', days: 0 },
                        { key: 'STARTER',  label: 'Starter',  price: '199₺/ay',  desc: '500 SMS/ay · 3 mağaza · WhatsApp', days: 30 },
                        { key: 'PRO',      label: 'Pro',      price: '399₺/ay',  desc: '2.000 SMS/ay · 10 mağaza · RTO', days: 30 },
                        { key: 'BUSINESS', label: 'Business', price: '799₺/ay',  desc: '5.000 SMS/ay · Sınırsız · API', days: 30 },
                      ] as const;
                      const colors: Record<string, { border: string; bg: string; badge: string; text: string }> = {
                        FREE:     { border: 'rgba(107,114,128,0.5)', bg: 'rgba(107,114,128,0.12)', badge: '#6b7280', text: '#9ca3af' },
                        STARTER:  { border: 'rgba(52,211,153,0.5)',  bg: 'rgba(52,211,153,0.12)',  badge: '#34d399', text: '#34d399' },
                        PRO:      { border: 'rgba(96,165,250,0.5)',  bg: 'rgba(96,165,250,0.12)',  badge: '#60a5fa', text: '#60a5fa' },
                        BUSINESS: { border: 'rgba(167,139,250,0.5)', bg: 'rgba(167,139,250,0.12)', badge: '#a78bfa', text: '#a78bfa' },
                      };
                      function calcExpiry(cycle: string) {
                        const d = new Date(); d.setDate(d.getDate() + (cycle === 'yearly' ? 365 : 30));
                        return d.toISOString().slice(0, 10);
                      }
                      return (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                            {planCards.map(({ key, label, price, desc }) => {
                              const isSelected = detailPlanValue === key;
                              const isCurrent = detailUser.plan === key;
                              const c = colors[key];
                              return (
                                <button key={key} type="button"
                                  onClick={() => {
                                    setDetailPlanValue(key);
                                    if (key !== 'FREE') setDetailExpiresValue(calcExpiry(detailCycleValue));
                                    else setDetailExpiresValue('');
                                  }}
                                  style={{ padding: '10px 10px 8px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', border: `2px solid ${isSelected ? c.border : 'rgba(255,255,255,0.07)'}`, background: isSelected ? c.bg : 'rgba(255,255,255,0.02)', outline: 'none' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: isSelected ? c.text : '#e5e7eb', fontSize: 13, fontWeight: 700 }}>{label}</span>
                                    {isCurrent && <span style={{ fontSize: 9, fontWeight: 700, color: c.badge, background: `${c.badge}20`, border: `1px solid ${c.badge}50`, borderRadius: 4, padding: '1px 5px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Mevcut</span>}
                                  </div>
                                  <div style={{ color: isSelected ? c.text : '#9ca3af', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{price}</div>
                                  <div style={{ color: '#4b5563', fontSize: 10, lineHeight: 1.4 }}>{desc}</div>
                                </button>
                              );
                            })}
                          </div>
                          {/* Fatura dönemi + bitiş */}
                          {detailPlanValue !== 'FREE' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                              <div>
                                <div style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Fatura Dönemi</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {(['monthly', 'yearly'] as const).map(c => (
                                    <button key={c} type="button"
                                      onClick={() => { setDetailCycleValue(c); setDetailExpiresValue(calcExpiry(c)); }}
                                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${detailCycleValue === c ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`, background: detailCycleValue === c ? 'rgba(139,92,246,0.15)' : 'transparent', color: detailCycleValue === c ? '#a78bfa' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                    >
                                      {c === 'monthly' ? '📅 Aylık (30 gün)' : '🗓 Yıllık (365 gün)'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Bitiş Tarihi</div>
                                <input type="date" value={detailExpiresValue} onChange={e => setDetailExpiresValue(e.target.value)} style={{ ...inputStyle, fontSize: 12, minHeight: 38 }} />
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <button onClick={handleUpdatePlan} disabled={detailPlanSaving} style={{ width: '100%', padding: '11px', background: detailPlanSaving ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 700, cursor: detailPlanSaving ? 'not-allowed' : 'pointer', minHeight: 42 }}>
                      {detailPlanSaving ? 'Kaydediliyor...' : `Planı Güncelle → ${detailPlanValue}`}
                    </button>
                  </div>

                  {/* Kredi Yönetimi */}
                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => { setCreditTarget(detailUser); setCreditSmsAmt(''); setCreditWpAmt(''); setCreditNote(''); }} style={{ width: '100%', padding: '10px', background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)', borderRadius: 10, color: '#34d399', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}>
                      + Kredi Yükle / Düş
                    </button>
                  </div>

                  {detailUserTransactions.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Kredi Geçmişi (son {detailUserTransactions.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                        {detailUserTransactions.map(tx => (
                          <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: '#9ca3af', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                              <div style={{ color: '#4b5563', fontSize: 10, marginTop: 2 }}>{new Date(tx.createdAt).toLocaleDateString('tr-TR')}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                              {tx.price && tx.price > 0 && <span style={{ color: '#6b7280', fontSize: 11 }}>{tx.price}₺</span>}
                              <span style={{ fontSize: 12, fontWeight: 700, color: tx.type === 'USAGE' ? '#a78bfa' : tx.type === 'WHATSAPP_PURCHASE' ? '#4ade80' : '#34d399' }}>
                                {tx.type === 'USAGE' ? '' : '+'}{tx.amount} {tx.type === 'WHATSAPP_PURCHASE' ? 'WP' : 'SMS'}
                              </span>
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

      {/* Credit modal — rendered AFTER user detail modal so it stacks on top */}
      {creditTarget && (
        <div onClick={() => setCreditTarget(null)} style={{ ...modalOverlay, zIndex: 110 }}>
          <div onClick={e => e.stopPropagation()} style={{ ...modalBox('rgba(5,150,105,0.25)'), zIndex: 111 }}>
            <ModalHeader title="Kredi Yönetimi" onClose={() => setCreditTarget(null)} />
            <div style={{ padding: '14px 20px 20px' }}>
              <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>
                <strong style={{ color: '#e5e7eb' }}>{creditTarget.name || creditTarget.email}</strong>
                <br />SMS: <strong style={{ color: '#34d399' }}>{creditTarget.smsCredits}</strong> · WP: <strong style={{ color: '#4ade80' }}>{creditTarget.whatsappCredits}</strong>
              </p>

              {/* Note field shared */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, marginBottom: 6 }}>Not (opsiyonel)</label>
                <input type="text" value={creditNote} onChange={e => setCreditNote(e.target.value)} placeholder="Kampanya kredisi..." style={inputStyle} />
              </div>

              {/* SMS row */}
              <div style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 10, padding: '12px', marginBottom: 10 }}>
                <div style={{ color: '#34d399', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>📱 SMS Kredisi</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number" value={creditSmsAmt} onChange={e => setCreditSmsAmt(e.target.value)}
                    placeholder="Miktar (negatif = düş)" style={{ ...inputStyle, flex: 1, minHeight: 40, fontSize: 13 }}
                  />
                  <button
                    onClick={() => handleAddCredit('sms')} disabled={creditSmsSaving}
                    style={{ padding: '8px 16px', background: creditSmsSaving ? 'rgba(5,150,105,0.3)' : 'linear-gradient(135deg, #059669, #10b981)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: creditSmsSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', minHeight: 40 }}
                  >
                    {creditSmsSaving ? '...' : 'Uygula'}
                  </button>
                </div>
              </div>

              {/* WhatsApp row */}
              <div style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 10, padding: '12px', marginBottom: 14 }}>
                <div style={{ color: '#4ade80', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>💬 WhatsApp Kredisi</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number" value={creditWpAmt} onChange={e => setCreditWpAmt(e.target.value)}
                    placeholder="Miktar (negatif = düş)" style={{ ...inputStyle, flex: 1, minHeight: 40, fontSize: 13 }}
                  />
                  <button
                    onClick={() => handleAddCredit('whatsapp')} disabled={creditWpSaving}
                    style={{ padding: '8px 16px', background: creditWpSaving ? 'rgba(37,211,102,0.3)' : 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: creditWpSaving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', minHeight: 40 }}
                  >
                    {creditWpSaving ? '...' : 'Uygula'}
                  </button>
                </div>
              </div>

              <button onClick={() => setCreditTarget(null)} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>Kapat</button>
            </div>
          </div>
        </div>
      )}

      {(detailOrderLoading || detailOrder) && (
        <div onClick={() => { setDetailOrder(null); setDetailOrderLoading(false); }} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={{ ...modalBox('rgba(96,165,250,0.25)'), maxWidth: 540 }}>
            <ModalHeader title={`Sipariş #${detailOrder?.id || ''}`} onClose={() => { setDetailOrder(null); setDetailOrderLoading(false); }} />
            <div style={{ padding: '16px 20px 20px' }}>
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
                    <div style={{ marginTop: 14 }}>
                      <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>SMS Logları ({detailOrder.smsLogs.length})</div>
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
                    <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', color: '#4b5563', fontSize: 13, textAlign: 'center' }}>
                      SMS logu yok
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {(detailShopLoading || detailShop) && (
        <div onClick={() => { setDetailShop(null); setDetailShopLoading(false); }} style={modalOverlay}>
          <div onClick={e => e.stopPropagation()} style={{ ...modalBox('rgba(6,182,212,0.25)'), maxWidth: 520 }}>
            <ModalHeader title="Mağaza Detayı" onClose={() => { setDetailShop(null); setDetailShopLoading(false); }} />
            <div style={{ padding: '16px 20px 20px' }}>
              {detailShopLoading ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>Yükleniyor...</div>
              ) : detailShop && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0891b2, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {detailShop.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{detailShop.name}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>{detailShop.shopDomain || 'Domain yok'}</div>
                    </div>
                  </div>
                  <InfoGrid items={[
                    { label: 'Toplam Sipariş', value: detailShop.orderCount, color: '#60a5fa' },
                    { label: 'Sahip', value: detailShop.user.email, color: '#9ca3af' },
                    { label: 'Kayıt Tarihi', value: new Date(detailShop.createdAt).toLocaleDateString('tr-TR'), color: '#9ca3af' },
                    { label: 'Sahip Adı', value: detailShop.user.name || '—', color: '#e5e7eb' },
                  ]} />
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[['Webhook Secret', detailShop.webhookSecret || '—'], ['SMS Şablonu', detailShop.smsTemplate || 'Varsayılan']].map(([lbl, val]) => (
                      <div key={lbl} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{lbl}</div>
                        <div style={{ color: '#9ca3af', fontSize: 12, fontFamily: lbl === 'Webhook Secret' ? 'monospace' : 'inherit', wordBreak: 'break-all', lineHeight: 1.5 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {detailShop.orders.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ color: '#4b5563', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Son Siparişler</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {detailShop.orders.map(o => (
                          <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <span style={{ color: '#4b5563', fontSize: 11 }}>#{o.id}</span>
                              <span style={{ color: '#e5e7eb', fontSize: 12, marginLeft: 8 }}>{o.customerName}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

  function renderContent() {
    return (
      <>
        {/* ── DASHBOARD ── */}
        {section === 'dashboard' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <StatCard label="Toplam Kullanıcı" value={stats.totalUsers} icon="👤" color="#7c3aed" />
              <StatCard label="Toplam Sipariş" value={stats.totalOrders} icon="📦" color="#0891b2" />
              <StatCard label="SMS Gönderildi" value={stats.totalSMSSent} icon="📱" color="#059669" />
              <StatCard label="Sistemdeki Kredi" value={stats.totalCreditsInSystem} icon="💳" color="#d97706" />
            </div>
            {Object.keys(stats.ordersByStatus).length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: isMobile ? 16 : 32, flexWrap: 'wrap' }}>
                {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                  <div key={status} style={{ textAlign: 'center' }}>
                    <div style={{ color: STATUS_COLORS[status] || '#e5e7eb', fontSize: 20, fontWeight: 800 }}>{count}</div>
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
            <div style={{ marginBottom: 14 }}>
              <input type="text" placeholder="Email veya isme göre ara..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                style={{ ...inputStyle, width: isMobile ? '100%' : 300 }} />
            </div>

            {isMobile ? (
              /* Mobile user cards */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredUsers.map(user => (
                  <div key={user.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                        {(user.name || user.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline dotted' }} onClick={() => openUserDetail(user)}>{user.name || '—'}</div>
                        <div style={{ color: '#6b7280', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                      </div>
                      <span style={{ color: user.smsCredits === 0 ? '#f87171' : user.smsCredits < 10 ? '#fbbf24' : '#34d399', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{user.smsCredits}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {user.plan && <PlanBadge plan={user.plan} />}
                      <button onClick={() => handleToggleAdmin(user)} disabled={togglingAdmin === user.id} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: togglingAdmin === user.id ? 'not-allowed' : 'pointer', background: user.isAdmin ? accentLight : 'rgba(255,255,255,0.04)', border: `1px solid ${user.isAdmin ? accentBorder : 'rgba(255,255,255,0.08)'}`, color: user.isAdmin ? '#fca5a5' : '#4b5563', minHeight: 32 }}>
                        {togglingAdmin === user.id ? '...' : user.isAdmin ? '🛡️ Admin' : 'Kullanıcı'}
                      </button>
                      <button onClick={() => { setCreditTarget(user); setCreditSmsAmt(''); setCreditWpAmt(''); setCreditNote(''); }} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)', color: '#34d399', cursor: 'pointer', minHeight: 32 }}>Kredi</button>
                      <button onClick={() => setDeleteTarget(user)} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', cursor: 'pointer', minHeight: 32 }}>Sil</button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>Sonuç bulunamadı</div>}
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Kullanıcı', 'Email', 'Kredi', 'Mağaza', 'Kayıt', 'Plan', 'Rol', ''].map((h, i) => (
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
                          {user.plan && <PlanBadge plan={user.plan} />}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => handleToggleAdmin(user)} disabled={togglingAdmin === user.id} style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: togglingAdmin === user.id ? 'not-allowed' : 'pointer', background: user.isAdmin ? accentLight : 'rgba(255,255,255,0.04)', border: `1px solid ${user.isAdmin ? accentBorder : 'rgba(255,255,255,0.08)'}`, color: user.isAdmin ? '#fca5a5' : '#4b5563' }}>
                            {togglingAdmin === user.id ? '...' : user.isAdmin ? '🛡️ Admin' : 'Kullanıcı'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setCreditTarget(user); setCreditSmsAmt(''); setCreditWpAmt(''); setCreditNote(''); }} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)', color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap' }}>Kredi</button>
                            <button onClick={() => setDeleteTarget(user)} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171', cursor: 'pointer' }}>Sil</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>Sonuç bulunamadı</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── SHOPS ── */}
        {section === 'shops' && (
          isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {shops.map(shop => (
                <div key={shop.id} onClick={() => openShopDetail(shop)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #0891b2, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{shop.name.slice(0, 2).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>{shop.name}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>{shop.shopDomain || '—'}</div>
                    </div>
                    <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{shop.orderCount} <span style={{ color: '#4b5563', fontSize: 11 }}>sipariş</span></div>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{shop.user.name || shop.user.email}</div>
                </div>
              ))}
              {shops.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>Henüz mağaza yok</div>}
            </div>
          ) : (
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
          )
        )}

        {/* ── SECURITY LOGS ── */}
        {section === 'security' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 16px', fontFamily: "'Syne', sans-serif" }}>
              Güvenlik Logları
            </h2>
            {securityLogs.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
                Henüz güvenlik logu yok
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {securityLogs.map(log => (
                  <div key={log.id} style={{
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 10, padding: '12px 16px',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: '#f87171', fontSize: 13, fontWeight: 500 }}>{log.reason}</span>
                      <span style={{ color: '#4b5563', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>IP: <span style={{ color: '#9ca3af' }}>{log.ip}</span></span>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>Endpoint: <span style={{ color: '#9ca3af' }}>{log.endpoint}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS ── */}
        {section === 'orders' && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <input type="text" placeholder="Müşteri adı, telefon veya mağaza..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                style={{ ...inputStyle, width: isMobile ? '100%' : 320 }} />
            </div>

            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredOrders.map(order => (
                  <div key={order.id} onClick={() => openOrderDetail(order)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ color: '#6b7280', fontSize: 12 }}>#{order.id} · {order.customerPhone}</div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>{order.shop.name}</span>
                      <span style={{ color: '#34d399', fontSize: 14, fontWeight: 700 }}>{order.total.toFixed(2)} ₺</span>
                    </div>
                    <div style={{ color: '#4b5563', fontSize: 11, marginTop: 4 }}>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
                  </div>
                ))}
                {filteredOrders.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>Sonuç bulunamadı</div>}
              </div>
            ) : (
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
            )}
          </div>
        )}
      </>
    );
  }
}
// 11 Mar 2026 Çar +03 02:48:57
