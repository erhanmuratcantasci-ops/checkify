'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

const API = 'http://127.0.0.1:3001';

const ALLOWED_VARS = ['{isim}', '{siparis_no}', '{link}', '{tutar}'];
const DEFAULT_TEMPLATE = 'Merhaba {isim}, {siparis_no} numaralı siparişinizi onaylamak için: {link}';

interface Shop {
  id: number;
  name: string;
  shopDomain: string | null;
  webhookSecret: string | null;
  smsTemplate: string | null;
  createdAt: string;
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

function validateTemplate(template: string): string | null {
  const found = template.match(/\{[^}]+\}/g) || [];
  const invalid = found.filter(v => !ALLOWED_VARS.includes(v));
  if (invalid.length > 0) {
    return `Geçersiz değişkenler: ${invalid.join(', ')}`;
  }
  return null;
}

export default function ShopsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Per-shop UI state
  const [secretVisible, setSecretVisible] = useState<Record<number, boolean>>({});
  const [templateEdit, setTemplateEdit] = useState<Record<number, string>>({});
  const [templateOpen, setTemplateOpen] = useState<Record<number, boolean>>({});
  const [templateSaving, setTemplateSaving] = useState<Record<number, boolean>>({});
  const [templateError, setTemplateError] = useState<Record<number, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    fetchUser();
    fetchShops();
  }, []);

  async function fetchUser() {
    const res = await fetch(`${API}/auth/me`, { headers: authHeaders() });
    if (!res.ok) { router.push('/login'); return; }
    const data = await res.json();
    const user = data.user ?? data;
    setUserName(user.name || user.email || '');
  }

  async function fetchShops() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/shops`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShops(data.shops ?? data);
    } catch {
      setShops([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const res = await fetch(`${API}/shops`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: newName, shopDomain: newDomain || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Oluşturulamadı');
      setShops(prev => [data.shop ?? data, ...prev]);
      setShowModal(false);
      setNewName('');
      setNewDomain('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`${API}/shops/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) {
      setShops(prev => prev.filter(s => s.id !== id));
      setDeleteConfirm(null);
    }
  }

  async function handleSaveTemplate(id: number) {
    const template = templateEdit[id] ?? '';
    const err = validateTemplate(template);
    if (err) {
      setTemplateError(prev => ({ ...prev, [id]: err }));
      return;
    }
    setTemplateSaving(prev => ({ ...prev, [id]: true }));
    setTemplateError(prev => ({ ...prev, [id]: '' }));
    try {
      const res = await fetch(`${API}/shops/${id}/template`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ template }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kaydedilemedi');
      setShops(prev => prev.map(s => s.id === id ? { ...s, smsTemplate: data.template } : s));
      setTemplateOpen(prev => ({ ...prev, [id]: false }));
    } catch (err) {
      setTemplateError(prev => ({ ...prev, [id]: err instanceof Error ? err.message : 'Hata' }));
    } finally {
      setTemplateSaving(prev => ({ ...prev, [id]: false }));
    }
  }

  function openTemplate(shop: Shop) {
    setTemplateEdit(prev => ({ ...prev, [shop.id]: shop.smsTemplate || DEFAULT_TEMPLATE }));
    setTemplateError(prev => ({ ...prev, [shop.id]: '' }));
    setTemplateOpen(prev => ({ ...prev, [shop.id]: true }));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif" }}>
      <Navbar userName={userName} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>Mağazalar</h1>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>Shopify mağazalarınızı yönetin</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setCreateError(''); }}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              border: 'none', borderRadius: 10, padding: '10px 20px',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
            }}
          >
            + Yeni Mağaza
          </button>
        </div>

        {/* Shop list */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: 80 }}>Yükleniyor...</div>
        ) : shops.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: 60, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🏪</div>
            <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>Henüz mağaza eklenmemiş</p>
            <p style={{ color: '#4b5563', fontSize: 13, margin: '6px 0 0' }}>Sağ üstteki butonu kullanarak ilk mağazanızı ekleyin</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {shops.map(shop => (
              <div key={shop.id} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '24px 28px',
              }}>
                {/* Shop header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: 0 }}>{shop.name}</h2>
                    {shop.shopDomain && (
                      <span style={{ color: '#a78bfa', fontSize: 13, marginTop: 4, display: 'block' }}>
                        {shop.shopDomain}
                      </span>
                    )}
                  </div>
                  {deleteConfirm === shop.id ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: '#f87171', fontSize: 13 }}>Silmek istediğinizden emin misiniz?</span>
                      <button
                        onClick={() => handleDelete(shop.id)}
                        style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '6px 14px', color: '#f87171', fontSize: 13, cursor: 'pointer' }}
                      >
                        Evet, Sil
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(shop.id)}
                      style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 14px', color: '#f87171', fontSize: 13, cursor: 'pointer' }}
                    >
                      Sil
                    </button>
                  )}
                </div>

                {/* Webhook Secret */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: '#6b7280', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Webhook Secret
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      readOnly
                      value={secretVisible[shop.id] ? (shop.webhookSecret || '—') : '••••••••••••••••••••••••••••••••'}
                      style={{
                        flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                        color: secretVisible[shop.id] ? '#d1d5db' : '#4b5563',
                        fontSize: 13, fontFamily: 'monospace', outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => setSecretVisible(prev => ({ ...prev, [shop.id]: !prev[shop.id] }))}
                      style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, padding: '10px 14px', color: '#9ca3af', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      {secretVisible[shop.id] ? 'Gizle' : 'Göster'}
                    </button>
                    <button
                      onClick={() => { if (shop.webhookSecret) navigator.clipboard.writeText(shop.webhookSecret); }}
                      style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, padding: '10px 14px', color: '#9ca3af', fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      Kopyala
                    </button>
                  </div>
                </div>

                {/* SMS Template */}
                {templateOpen[shop.id] ? (
                  <div>
                    <label style={{ color: '#6b7280', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      SMS Şablonu
                    </label>
                    <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {ALLOWED_VARS.map(v => (
                        <span key={v} style={{
                          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                          borderRadius: 6, padding: '2px 8px', color: '#a78bfa', fontSize: 12, cursor: 'pointer',
                        }}
                          onClick={() => setTemplateEdit(prev => ({ ...prev, [shop.id]: (prev[shop.id] || '') + v }))}
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                    <textarea
                      value={templateEdit[shop.id] ?? ''}
                      onChange={e => setTemplateEdit(prev => ({ ...prev, [shop.id]: e.target.value }))}
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                        color: '#d1d5db', fontSize: 14, resize: 'vertical', outline: 'none',
                        boxSizing: 'border-box', fontFamily: "'Outfit', sans-serif",
                      }}
                    />
                    {templateError[shop.id] && (
                      <p style={{ color: '#f87171', fontSize: 13, margin: '6px 0 0' }}>{templateError[shop.id]}</p>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => handleSaveTemplate(shop.id)}
                        disabled={templateSaving[shop.id]}
                        style={{
                          background: templateSaving[shop.id] ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                          border: 'none', borderRadius: 8, padding: '8px 18px',
                          color: '#fff', fontSize: 13, fontWeight: 600, cursor: templateSaving[shop.id] ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {templateSaving[shop.id] ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                      <button
                        onClick={() => setTemplateOpen(prev => ({ ...prev, [shop.id]: false }))}
                        style={{
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 8, padding: '8px 18px', color: '#9ca3af', fontSize: 13, cursor: 'pointer',
                        }}
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <label style={{ color: '#6b7280', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        SMS Şablonu
                      </label>
                      <p style={{ color: '#9ca3af', fontSize: 13, margin: 0, fontStyle: shop.smsTemplate ? 'normal' : 'italic' }}>
                        {shop.smsTemplate || DEFAULT_TEMPLATE}
                      </p>
                    </div>
                    <button
                      onClick={() => openTemplate(shop)}
                      style={{
                        background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                        borderRadius: 8, padding: '8px 16px', color: '#a78bfa', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 16,
                      }}
                    >
                      Düzenle
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 440,
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 24px' }}>Yeni Mağaza Ekle</h2>
            {createError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 16 }}>
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Mağaza Adı *</label>
                <input
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Mağazam"
                  style={{
                    width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                    color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Shopify Domain (opsiyonel)</label>
                <input
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  placeholder="magazam.myshopify.com"
                  style={{
                    width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                    color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    flex: 1, padding: '13px', background: creating ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 600,
                    cursor: creating ? 'not-allowed' : 'pointer', boxShadow: creating ? 'none' : '0 4px 20px rgba(139,92,246,0.35)',
                  }}
                >
                  {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: '13px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                    color: '#9ca3af', fontSize: 15, cursor: 'pointer',
                  }}
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
