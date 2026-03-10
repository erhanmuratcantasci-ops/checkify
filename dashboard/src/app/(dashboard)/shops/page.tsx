'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import { SkeletonShopCard } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

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
  if (typeof window === 'undefined') return null;
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

const WEBHOOK_URL = 'https://api.chekkify.com/webhook/orders/create';

const STEPS: { title: string; desc: React.ReactNode }[] = [
  {
    title: 'Shopify Admin\'e Git',
    desc: 'Tarayıcınızda Shopify yönetim panelinizi açın.',
  },
  {
    title: 'Ayarlar → Bildirimler → Webhook\'lar',
    desc: (
      <>
        Sol menüden <strong style={{ color: '#c4b5fd' }}>Ayarlar</strong> →{' '}
        <strong style={{ color: '#c4b5fd' }}>Bildirimler</strong> bölümüne gidin.
        Sayfanın en altında <strong style={{ color: '#c4b5fd' }}>Webhook&apos;lar</strong> bölümünü bulun.
      </>
    ),
  },
  {
    title: '"Webhook oluştur" Butonuna Tıkla',
    desc: 'Webhook\'lar bölümündeki "Webhook oluştur" butonuna tıklayın.',
  },
  {
    title: 'Webhook Ayarlarını Gir',
    desc: null, // rendered separately
  },
  {
    title: 'Webhook Secret\'ı Kopyala',
    desc: 'Aşağıdaki secret\'ı kopyalayıp Shopify\'daki "İmzalama anahtarı" alanına yapıştırın.',
  },
];

const WEBHOOK_SETTINGS = [
  { label: 'Olay', value: 'Sipariş oluşturuldu (orders/create)' },
  { label: 'Format', value: 'JSON' },
  { label: 'URL', value: WEBHOOK_URL },
  { label: 'Webhook API sürümü', value: 'En güncel sürüm' },
];

function WebhookGuideModal({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  const [secretVisible, setSecretVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 200, padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(13,13,24,0.98)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 20, width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '26px 28px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: 'rgba(13,13,24,0.98)',
          borderRadius: '20px 20px 0 0', zIndex: 1,
        }}>
          <div>
            <div style={{ color: '#7c3aed', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
              Webhook Kurulum Rehberi
            </div>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{shop.name}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, width: 32, height: 32, color: '#9ca3af', fontSize: 16,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Steps */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((step, i) => {
            const isLast = i === STEPS.length - 1;
            return (
              <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: isLast ? 0 : 28, position: 'relative' }}>
                {/* Line connector */}
                {!isLast && (
                  <div style={{
                    position: 'absolute', left: 17, top: 36, bottom: 0,
                    width: 1, background: 'rgba(139,92,246,0.2)',
                  }} />
                )}

                {/* Step number */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  boxShadow: '0 0 16px rgba(139,92,246,0.4)',
                }}>
                  {i + 1}
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                    {step.title}
                  </div>

                  {/* Step 4 — settings table */}
                  {i === 3 ? (
                    <div style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12, overflow: 'hidden',
                    }}>
                      {WEBHOOK_SETTINGS.map((s, si) => (
                        <div key={s.label} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '11px 16px',
                          borderBottom: si < WEBHOOK_SETTINGS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        }}>
                          <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0, marginRight: 12 }}>
                            {s.label}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              color: s.label === 'URL' ? '#a78bfa' : '#e5e7eb',
                              fontSize: 13, fontFamily: s.label === 'URL' ? 'monospace' : 'inherit',
                              textAlign: 'right', wordBreak: 'break-all',
                            }}>
                              {s.value}
                            </span>
                            {s.label === 'URL' && (
                              <button
                                onClick={() => copy(s.value, 'url')}
                                style={{
                                  background: copied === 'url' ? 'rgba(5,150,105,0.2)' : 'rgba(139,92,246,0.15)',
                                  border: `1px solid ${copied === 'url' ? 'rgba(5,150,105,0.4)' : 'rgba(139,92,246,0.3)'}`,
                                  borderRadius: 6, padding: '4px 10px',
                                  color: copied === 'url' ? '#34d399' : '#a78bfa',
                                  fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                                }}
                              >
                                {copied === 'url' ? '✓ Kopyalandı' : 'Kopyala'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : i === 4 ? (
                    /* Step 5 — secret */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                        {step.desc as string}
                      </p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{
                          flex: 1, padding: '10px 14px',
                          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                          borderRadius: 8, fontFamily: 'monospace', fontSize: 13,
                          color: secretVisible ? '#c4b5fd' : '#4b5563',
                          letterSpacing: secretVisible ? 'normal' : '2px', wordBreak: 'break-all',
                        }}>
                          {secretVisible ? (shop.webhookSecret || '—') : '••••••••••••••••••••••••••••••••'}
                        </div>
                        <button
                          onClick={() => setSecretVisible(v => !v)}
                          style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8, padding: '10px 12px', color: '#9ca3af', fontSize: 12,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          {secretVisible ? 'Gizle' : 'Göster'}
                        </button>
                        <button
                          onClick={() => shop.webhookSecret && copy(shop.webhookSecret, 'secret')}
                          style={{
                            background: copied === 'secret' ? 'rgba(5,150,105,0.2)' : 'rgba(139,92,246,0.15)',
                            border: `1px solid ${copied === 'secret' ? 'rgba(5,150,105,0.4)' : 'rgba(139,92,246,0.3)'}`,
                            borderRadius: 8, padding: '10px 12px',
                            color: copied === 'secret' ? '#34d399' : '#a78bfa',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          {copied === 'secret' ? '✓ Kopyalandı' : 'Kopyala'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.65, margin: 0 }}>
                      {step.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 28px 28px' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '13px',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              border: 'none', borderRadius: 12, color: '#fff',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
            }}
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    </div>
  );
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
  const { showToast } = useToast();
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
  const [guideShop, setGuideShop] = useState<Shop | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    fetchShops();
  }, []);

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
      showToast('Mağaza başarıyla eklendi', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Hata oluştu';
      setCreateError(msg);
      showToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`${API}/shops/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) {
      setShops(prev => prev.filter(s => s.id !== id));
      setDeleteConfirm(null);
      showToast('Mağaza silindi', 'info');
    } else {
      showToast('Mağaza silinemedi', 'error');
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
      showToast('SMS şablonu kaydedildi', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Hata';
      setTemplateError(prev => ({ ...prev, [id]: msg }));
      showToast(msg, 'error');
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
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar />

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: 2 }).map((_, i) => <SkeletonShopCard key={i} />)}
          </div>
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
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={() => setGuideShop(shop)}
                      style={{
                        background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: 8, padding: '6px 14px', color: '#a78bfa', fontSize: 13,
                        fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Kurulum Rehberi
                    </button>
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

      {/* Webhook Guide Modal */}
      {guideShop && (
        <WebhookGuideModal shop={guideShop} onClose={() => setGuideShop(null)} />
      )}

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
