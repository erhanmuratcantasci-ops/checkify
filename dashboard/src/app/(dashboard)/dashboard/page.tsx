'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, orders, User, OrderStats } from '@/lib/api';
import Navbar from '@/components/Navbar';

const inputStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    auth.me()
      .then(({ user }) => {
        setUser(user);
        setName(user.name ?? '');
        setEmail(user.email);
      })
      .catch(() => router.push('/login'));

    orders.stats().then(setStats).catch(() => {});
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const { user: updated } = await auth.updateMe({
        name: name || undefined,
        email: email !== user?.email ? email : undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setUser(updated);
      setEditing(false);
      setCurrentPassword(''); setNewPassword('');
      setSuccess('Profil güncellendi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (!user) return;
    setName(user.name ?? ''); setEmail(user.email);
    setCurrentPassword(''); setNewPassword('');
    setError(''); setEditing(false);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();

  const memberSince = new Date(user.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const statCards = [
    { label: 'Toplam Sipariş', value: stats ? String(stats.total) : '—', sub: 'İptal hariç' },
    { label: 'Toplam Gelir', value: stats ? `${stats.totalRevenue.toFixed(2)} ₺` : '—', sub: 'İptal hariç' },
    { label: 'Bekleyen', value: stats ? String(stats.byStatus['PENDING'] ?? 0) : '—', sub: 'Onay bekliyor' },
    { label: 'Onaylanan', value: stats ? String(stats.byStatus['CONFIRMED'] ?? 0) : '—', sub: 'Onaylandı' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar userName={user.name ?? user.email} />

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-syne)' }}>
            Hoş geldin, {user.name ?? 'kullanıcı'}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Dashboard'una genel bakış</p>
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-2xl px-5 py-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-syne)' }}>{card.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {success && (
          <p className="text-sm rounded-lg px-4 py-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
            {success}
          </p>
        )}

        {/* Profil Kartı */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Profil Bilgileri</h3>
            {!editing && (
              <button
                onClick={() => { setEditing(true); setSuccess(''); }}
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                Düzenle
              </button>
            )}
          </div>

          {!editing ? (
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                {initials}
              </div>
              <div className="space-y-1">
                {user.name && <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>}
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Üye olma tarihi: {memberSince}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Ad Soyad', type: 'text', value: name, onChange: setName, required: false },
                  { label: 'Email', type: 'email', value: email, onChange: setEmail, required: true },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                    <input
                      type={f.type}
                      required={f.required}
                      value={f.value}
                      onChange={(e) => f.onChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={inputStyle}
                      onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Şifre değiştir <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(isteğe bağlı)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Mevcut şifre', value: currentPassword, onChange: setCurrentPassword },
                    { label: 'Yeni şifre', value: newPassword, onChange: setNewPassword },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                      <input
                        type="password"
                        value={f.value}
                        onChange={(e) => f.onChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={inputStyle}
                        onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                        placeholder="••••••••"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
                  style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  İptal
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Bilgi Satırları */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {[
            ['Kullanıcı ID', `#${user.id}`],
            ['Ad Soyad', user.name ?? '—'],
            ['Email', user.email],
            ['Kayıt tarihi', memberSince],
          ].map(([label, value], i, arr) => (
            <div
              key={label}
              className="flex items-center justify-between px-6 py-4"
              style={{
                background: 'var(--bg-surface)',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
