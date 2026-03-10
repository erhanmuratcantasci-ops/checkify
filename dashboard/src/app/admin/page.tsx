'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import { useToast } from '@/components/Toast';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

function getToken() {
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  smsCredits: number;
  isAdmin: boolean;
  shopCount: number;
  createdAt: string;
  lastLoginAt: string | null;
}

interface AdminUserDetail extends AdminUser {
  orderCount: number;
}

interface AdminShop {
  id: number;
  name: string;
  domain: string;
  createdAt: string;
  orderCount: number;
  user: { id: number; email: string; name: string | null };
}

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalSMSSent: number;
  totalCreditsInSystem: number;
  ordersByStatus: Record<string, number>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor', CONFIRMED: 'Onaylandı', PREPARING: 'Hazırlanıyor',
  SHIPPED: 'Kargoda', DELIVERED: 'Teslim', CANCELLED: 'İptal',
};

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
      }} />
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{value}</div>
      <div style={{ color: '#6b7280', fontSize: 12, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Credit modal
  const [creditTarget, setCreditTarget] = useState<AdminUser | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDesc, setCreditDesc] = useState('');
  const [creditSaving, setCreditSaving] = useState(false);

  // Admin toggle loading
  const [togglingAdmin, setTogglingAdmin] = useState<number | null>(null);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // User detail modal
  const [detailUser, setDetailUser] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { void (async () => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }

    const meRes = await fetch(`${API}/auth/me`, { headers: authHeaders() });
    const meData = await meRes.json();
    if (!meData.user?.isAdmin) { router.push('/dashboard'); return; }

    Promise.all([
      fetch(`${API}/admin/users`, { headers: authHeaders() }),
      fetch(`${API}/admin/stats`, { headers: authHeaders() }),
      fetch(`${API}/admin/shops`, { headers: authHeaders() }),
    ]).then(async ([uRes, sRes, shRes]) => {
      if (uRes.status === 403 || uRes.status === 401) {
        router.push('/dashboard');
        return;
      }
      const [uData, sData, shData] = await Promise.all([uRes.json(), sRes.json(), shRes.json()]);
      setUsers(uData.users || []);
      setStats(sData);
      setShops(shData.shops || []);
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
      setCreditTarget(null);
      setCreditAmount('');
      setCreditDesc('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
    } finally {
      setCreditSaving(false);
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
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
    } finally {
      setTogglingAdmin(null);
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/admin/users/${deleteTarget.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata oluştu');
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      showToast('Kullanıcı silindi', 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function openUserDetail(user: AdminUser) {
    setDetailLoading(true);
    setDetailUser(null);
    try {
      const res = await fetch(`${API}/admin/users/${user.id}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hata oluştu');
      setDetailUser(data.user);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error');
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: 14 }}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 20, padding: '4px 12px', marginBottom: 12,
          }}>
            <span style={{ fontSize: 11 }}>🛡️</span>
            <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Admin Panel</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>Platform Yönetimi</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>{users.length} kullanıcı kayıtlı</p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
            <StatCard label="Toplam Kullanıcı" value={stats.totalUsers} icon="👤" color="#7c3aed" />
            <StatCard label="Toplam Sipariş" value={stats.totalOrders} icon="📦" color="#0891b2" />
            <StatCard label="SMS Gönderildi" value={stats.totalSMSSent} icon="📱" color="#059669" />
            <StatCard label="Sistemdeki Kredi" value={stats.totalCreditsInSystem} icon="💳" color="#d97706" />
          </div>
        )}

        {/* Orders by status */}
        {stats && Object.keys(stats.ordersByStatus).length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '18px 24px', marginBottom: 28,
            display: 'flex', gap: 24, flexWrap: 'wrap',
          }}>
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} style={{ textAlign: 'center' }}>
                <div style={{ color: '#e5e7eb', fontSize: 18, fontWeight: 700 }}>{count}</div>
                <div style={{ color: '#4b5563', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {STATUS_LABELS[status] || status}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users table */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, overflow: 'hidden', marginBottom: 32,
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
              Kullanıcılar
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Kullanıcı', 'Email', 'Kredi', 'Mağaza', 'Kayıt', 'Rol', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '12px 20px', textAlign: 'left', color: '#4b5563',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                      onClick={() => openUserDetail(user)}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff',
                      }}>
                        {(user.name || user.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 500, textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>
                        {user.name || '—'}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#9ca3af', fontSize: 13 }}>{user.email}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      color: user.smsCredits === 0 ? '#f87171' : user.smsCredits < 10 ? '#fbbf24' : '#34d399',
                      fontSize: 14, fontWeight: 700,
                    }}>
                      {user.smsCredits}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: 13 }}>{user.shopCount}</td>
                  <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: 12 }}>
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      onClick={() => handleToggleAdmin(user)}
                      disabled={togglingAdmin === user.id}
                      style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                        cursor: togglingAdmin === user.id ? 'not-allowed' : 'pointer',
                        background: user.isAdmin ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${user.isAdmin ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        color: user.isAdmin ? '#a78bfa' : '#4b5563',
                        transition: 'all 0.15s',
                      }}
                    >
                      {togglingAdmin === user.id ? '...' : user.isAdmin ? '🛡️ Admin' : 'Kullanıcı'}
                    </button>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setCreditTarget(user); setCreditAmount(''); setCreditDesc(''); }}
                        style={{
                          padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                          background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)',
                          color: '#34d399', cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        Kredi Yükle
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        style={{
                          padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                          color: '#f87171', cursor: 'pointer',
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Shops table */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
              Aktif Mağazalar ({shops.length})
            </h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Mağaza', 'Domain', 'Sahip', 'Sipariş', 'Kayıt'].map((h, i) => (
                  <th key={i} style={{
                    padding: '12px 20px', textAlign: 'left', color: '#4b5563',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shops.map((shop, i) => (
                <tr key={shop.id} style={{ borderBottom: i < shops.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff',
                      }}>
                        {shop.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 500 }}>{shop.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: 13 }}>{shop.domain}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ color: '#9ca3af', fontSize: 13 }}>{shop.user.name || shop.user.email}</div>
                    {shop.user.name && <div style={{ color: '#4b5563', fontSize: 11 }}>{shop.user.email}</div>}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#e5e7eb', fontSize: 14, fontWeight: 600 }}>{shop.orderCount}</td>
                  <td style={{ padding: '14px 20px', color: '#6b7280', fontSize: 12 }}>
                    {new Date(shop.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                </tr>
              ))}
              {shops.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#4b5563', fontSize: 13 }}>
                    Henüz mağaza yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Credit modal */}
      {creditTarget && (
        <div
          onClick={() => setCreditTarget(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 100, padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(13,13,24,0.98)', border: '1px solid rgba(5,150,105,0.25)',
              borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 420,
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            }}
          >
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>Kredi Yükle</h2>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 24px' }}>
              {creditTarget.name || creditTarget.email} — mevcut: <strong style={{ color: '#e5e7eb' }}>{creditTarget.smsCredits}</strong>
            </p>
            <form onSubmit={handleAddCredits} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>
                  Miktar <span style={{ color: '#4b5563', fontWeight: 400 }}>(negatif değer düşer)</span>
                </label>
                <input
                  type="number"
                  required
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value)}
                  placeholder="100"
                  style={{
                    width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                    color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(5,150,105,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>Açıklama (opsiyonel)</label>
                <input
                  type="text"
                  value={creditDesc}
                  onChange={e => setCreditDesc(e.target.value)}
                  placeholder="Kampanya kredisi"
                  style={{
                    width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                    color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(5,150,105,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={creditSaving}
                  style={{
                    flex: 1, padding: '12px',
                    background: creditSaving ? 'rgba(5,150,105,0.3)' : 'linear-gradient(135deg, #059669, #10b981)',
                    border: 'none', borderRadius: 10, color: '#fff',
                    fontSize: 14, fontWeight: 600, cursor: creditSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {creditSaving ? 'Yükleniyor...' : 'Yükle'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreditTarget(null)}
                  style={{
                    flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                    color: '#9ca3af', fontSize: 14, cursor: 'pointer',
                  }}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div
          onClick={() => !deleting && setDeleteTarget(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 100, padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(13,13,24,0.98)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 400,
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 16, textAlign: 'center' }}>🗑️</div>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px', textAlign: 'center' }}>Kullanıcıyı Sil</h2>
            <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6 }}>
              <strong style={{ color: '#e5e7eb' }}>{deleteTarget.name || deleteTarget.email}</strong> hesabını silmek istediğinden emin misin?
              Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                style={{
                  flex: 1, padding: '12px',
                  background: deleting ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                  border: 'none', borderRadius: 10, color: '#fff',
                  fontSize: 14, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Siliniyor...' : 'Sil'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                  color: '#9ca3af', fontSize: 14, cursor: 'pointer',
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User detail modal */}
      {(detailLoading || detailUser) && (
        <div
          onClick={() => { setDetailUser(null); setDetailLoading(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 100, padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(13,13,24,0.98)', border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 460,
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            }}
          >
            {detailLoading ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>Yükleniyor...</div>
            ) : detailUser && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {(detailUser.name || detailUser.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{detailUser.name || '—'}</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>{detailUser.email}</div>
                  </div>
                  {detailUser.isAdmin && (
                    <span style={{
                      marginLeft: 'auto', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa',
                    }}>🛡️ Admin</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'SMS Kredisi', value: detailUser.smsCredits, color: detailUser.smsCredits === 0 ? '#f87171' : detailUser.smsCredits < 10 ? '#fbbf24' : '#34d399' },
                    { label: 'Mağaza Sayısı', value: detailUser.shopCount, color: '#e5e7eb' },
                    { label: 'Sipariş Sayısı', value: detailUser.orderCount, color: '#e5e7eb' },
                    { label: 'Kayıt Tarihi', value: new Date(detailUser.createdAt).toLocaleDateString('tr-TR'), color: '#9ca3af' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10, padding: '14px 16px',
                    }}>
                      <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
                      <div style={{ color, fontSize: 18, fontWeight: 700 }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Son Giriş</div>
                  <div style={{ color: '#9ca3af', fontSize: 13 }}>
                    {detailUser.lastLoginAt ? new Date(detailUser.lastLoginAt).toLocaleString('tr-TR') : 'Henüz giriş yapılmadı'}
                  </div>
                </div>

                <button
                  onClick={() => { setDetailUser(null); setDetailLoading(false); }}
                  style={{
                    width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                    color: '#9ca3af', fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Kapat
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
