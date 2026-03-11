'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import { SkeletonShopCard } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { useTranslation } from '@/lib/i18n';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

const ALLOWED_VARS = ['{isim}', '{siparis_no}', '{link}', '{tutar}', '{status_link}', '{prepaid_link}'];
const DEFAULT_TEMPLATE = 'Merhaba {isim}, {siparis_no} numaralı siparişinizi onaylamak için: {link}';

interface Shop {
  id: number;
  name: string;
  shopDomain: string | null;
  webhookSecret: string | null;
  smsTemplate: string | null;
  smsStartHour: number;
  smsEndHour: number;
  createdAt: string;
  prepaidEnabled: boolean;
  prepaidDiscount: number;
}

interface BlockedPhone {
  id: number;
  phone: string;
  createdAt: string;
}

interface BlockedPostalCode {
  id: number;
  postalCode: string;
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

function padHour(n: number) { return String(n).padStart(2, '0'); }

const hourOptions = Array.from({ length: 24 }, (_, i) => i);

function WebhookGuideModal({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  const { t } = useTranslation();
  const [secretVisible, setSecretVisible] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const STEPS: { title: string; desc: React.ReactNode }[] = [
    { title: t('shops_guide_s1'), desc: t('shops_guide_s1_desc') },
    {
      title: t('shops_guide_s2'),
      desc: (
        <>
          Sol menüden <strong style={{ color: '#c4b5fd' }}>Ayarlar</strong> →{' '}
          <strong style={{ color: '#c4b5fd' }}>Bildirimler</strong> bölümüne gidin.
          Sayfanın en altında <strong style={{ color: '#c4b5fd' }}>Webhook&apos;lar</strong> bölümünü bulun.
        </>
      ),
    },
    { title: t('shops_guide_s3'), desc: t('shops_guide_s3_desc') },
    { title: t('shops_guide_s4'), desc: null },
    { title: t('shops_guide_s5'), desc: t('shops_guide_s5_desc') },
  ];

  const WEBHOOK_SETTINGS = [
    { label: t('shops_guide_event'), value: t('shops_guide_event_val') },
    { label: t('shops_guide_format'), value: 'JSON' },
    { label: t('shops_guide_url_label'), value: WEBHOOK_URL },
    { label: t('shops_guide_version'), value: t('shops_guide_version_val') },
  ];

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
        <div style={{
          padding: '26px 28px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: 'rgba(13,13,24,0.98)',
          borderRadius: '20px 20px 0 0', zIndex: 1,
        }}>
          <div>
            <div style={{ color: '#7c3aed', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
              {t('shops_guide_badge')}
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

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((step, i) => {
            const isLast = i === STEPS.length - 1;
            return (
              <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: isLast ? 0 : 28, position: 'relative' }}>
                {!isLast && (
                  <div style={{
                    position: 'absolute', left: 17, top: 36, bottom: 0,
                    width: 1, background: 'rgba(139,92,246,0.2)',
                  }} />
                )}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  boxShadow: '0 0 16px rgba(139,92,246,0.4)',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{step.title}</div>
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
                              color: s.label === t('shops_guide_url_label') ? '#a78bfa' : '#e5e7eb',
                              fontSize: 13, fontFamily: s.label === t('shops_guide_url_label') ? 'monospace' : 'inherit',
                              textAlign: 'right', wordBreak: 'break-all',
                            }}>
                              {s.value}
                            </span>
                            {s.label === t('shops_guide_url_label') && (
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
                                {copied === 'url' ? t('copied') : t('copy')}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : i === 4 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{step.desc as string}</p>
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
                          {secretVisible ? t('hide') : t('show')}
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
                          {copied === 'secret' ? t('copied') : t('copy')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

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
            {t('shops_guide_close')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
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

  // Schedule state
  const [scheduleEdit, setScheduleEdit] = useState<Record<number, { start: number; end: number }>>({});
  const [scheduleOpen, setScheduleOpen] = useState<Record<number, boolean>>({});
  const [scheduleSaving, setScheduleSaving] = useState<Record<number, boolean>>({});

  // Blocked phones state
  const [blockedPhones, setBlockedPhones] = useState<Record<number, BlockedPhone[]>>({});
  const [blockOpen, setBlockOpen] = useState<Record<number, boolean>>({});
  const [blockInput, setBlockInput] = useState<Record<number, string>>({});
  const [blockLoading, setBlockLoading] = useState<Record<number, boolean>>({});

  // Blocked postal codes state
  const [blockedPostalCodes, setBlockedPostalCodes] = useState<Record<number, BlockedPostalCode[]>>({});
  const [postalOpen, setPostalOpen] = useState<Record<number, boolean>>({});
  const [newPostalCode, setNewPostalCode] = useState<Record<number, string>>({});
  const [postalLoading, setPostalLoading] = useState<Record<number, boolean>>({});

  // Prepaid state
  const [prepaidSaving, setPrepaidSaving] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    fetchShops();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateTemplate(template: string): string | null {
    const found = template.match(/\{[^}]+\}/g) || [];
    const invalid = found.filter(v => !ALLOWED_VARS.includes(v));
    if (invalid.length > 0) return `${t('shops_invalid_vars')} ${invalid.join(', ')}`;
    return null;
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

  function loadShops() { fetchShops(); }

  async function updatePrepaid(shopId: number, enabled: boolean, discount: number) {
    setPrepaidSaving(prev => ({ ...prev, [shopId]: true }));
    await fetch(`${API}/shops/${shopId}/prepaid`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ prepaidEnabled: enabled, prepaidDiscount: discount }),
    });
    setPrepaidSaving(prev => ({ ...prev, [shopId]: false }));
    loadShops();
  }

  async function fetchBlocked(shopId: number) {
    try {
      const res = await fetch(`${API}/shops/${shopId}/blocked-phones`, { headers: authHeaders() });
      const data = await res.json();
      setBlockedPhones(prev => ({ ...prev, [shopId]: data.blocked ?? [] }));
    } catch {
      setBlockedPhones(prev => ({ ...prev, [shopId]: [] }));
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
      if (!res.ok) throw new Error(data.error || t('error_occurred'));
      setShops(prev => [data.shop ?? data, ...prev]);
      setShowModal(false);
      setNewName('');
      setNewDomain('');
      showToast(t('shops_toast_created'), 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('error_occurred');
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
      showToast(t('shops_toast_deleted'), 'info');
    } else {
      showToast(t('shops_toast_delete_error'), 'error');
    }
  }

  async function handleSaveTemplate(id: number) {
    const template = templateEdit[id] ?? '';
    const err = validateTemplate(template);
    if (err) { setTemplateError(prev => ({ ...prev, [id]: err })); return; }
    setTemplateSaving(prev => ({ ...prev, [id]: true }));
    setTemplateError(prev => ({ ...prev, [id]: '' }));
    try {
      const res = await fetch(`${API}/shops/${id}/template`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ template }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error_occurred'));
      setShops(prev => prev.map(s => s.id === id ? { ...s, smsTemplate: data.template } : s));
      setTemplateOpen(prev => ({ ...prev, [id]: false }));
      showToast(t('shops_toast_template_saved'), 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('error_occurred');
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

  function openSchedule(shop: Shop) {
    setScheduleEdit(prev => ({ ...prev, [shop.id]: { start: shop.smsStartHour, end: shop.smsEndHour } }));
    setScheduleOpen(prev => ({ ...prev, [shop.id]: true }));
  }

  async function handleSaveSchedule(id: number) {
    const { start, end } = scheduleEdit[id] ?? { start: 9, end: 21 };
    setScheduleSaving(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API}/shops/${id}/schedule`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ smsStartHour: start, smsEndHour: end }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error_occurred'));
      setShops(prev => prev.map(s => s.id === id ? { ...s, smsStartHour: start, smsEndHour: end } : s));
      setScheduleOpen(prev => ({ ...prev, [id]: false }));
      showToast(t('shops_toast_schedule_saved'), 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error_occurred'), 'error');
    } finally {
      setScheduleSaving(prev => ({ ...prev, [id]: false }));
    }
  }

  async function toggleBlockSection(shopId: number) {
    const isOpen = blockOpen[shopId];
    if (!isOpen && !blockedPhones[shopId]) {
      await fetchBlocked(shopId);
    }
    setBlockOpen(prev => ({ ...prev, [shopId]: !isOpen }));
  }

  async function handleAddBlocked(shopId: number) {
    const phone = (blockInput[shopId] ?? '').trim();
    if (!phone) return;
    setBlockLoading(prev => ({ ...prev, [shopId]: true }));
    try {
      const res = await fetch(`${API}/shops/${shopId}/blocked-phones`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error_occurred'));
      setBlockedPhones(prev => ({ ...prev, [shopId]: [data.entry, ...(prev[shopId] ?? [])] }));
      setBlockInput(prev => ({ ...prev, [shopId]: '' }));
      showToast(t('shops_toast_blocked_added'), 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error_occurred'), 'error');
    } finally {
      setBlockLoading(prev => ({ ...prev, [shopId]: false }));
    }
  }

  async function handleRemoveBlocked(shopId: number, phone: string) {
    const res = await fetch(`${API}/shops/${shopId}/blocked-phones/${encodeURIComponent(phone)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      setBlockedPhones(prev => ({ ...prev, [shopId]: (prev[shopId] ?? []).filter(b => b.phone !== phone) }));
      showToast(t('shops_toast_blocked_removed'), 'info');
    } else {
      showToast(t('shops_toast_block_remove_error'), 'error');
    }
  }

  async function loadPostalCodes(shopId: number) {
    try {
      const res = await fetch(`${API}/shops/${shopId}/blocked-postal-codes`, { headers: authHeaders() });
      const data = await res.json();
      setBlockedPostalCodes(prev => ({ ...prev, [shopId]: data.blocked ?? [] }));
    } catch {
      setBlockedPostalCodes(prev => ({ ...prev, [shopId]: [] }));
    }
  }

  async function togglePostalSection(shopId: number) {
    const isOpen = postalOpen[shopId];
    if (!isOpen && !blockedPostalCodes[shopId]) {
      await loadPostalCodes(shopId);
    }
    setPostalOpen(prev => ({ ...prev, [shopId]: !isOpen }));
  }

  async function addPostalCode(shopId: number) {
    const postalCode = (newPostalCode[shopId] ?? '').trim();
    if (!postalCode) return;
    setPostalLoading(prev => ({ ...prev, [shopId]: true }));
    try {
      const res = await fetch(`${API}/shops/${shopId}/blocked-postal-codes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ postalCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error_occurred'));
      setBlockedPostalCodes(prev => ({ ...prev, [shopId]: [data.entry, ...(prev[shopId] ?? [])] }));
      setNewPostalCode(prev => ({ ...prev, [shopId]: '' }));
      showToast('Posta kodu engellendi', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('error_occurred'), 'error');
    } finally {
      setPostalLoading(prev => ({ ...prev, [shopId]: false }));
    }
  }

  async function removePostalCode(shopId: number, postalCode: string) {
    const res = await fetch(`${API}/shops/${shopId}/blocked-postal-codes/${encodeURIComponent(postalCode)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      setBlockedPostalCodes(prev => ({ ...prev, [shopId]: (prev[shopId] ?? []).filter(b => b.postalCode !== postalCode) }));
      showToast('Posta kodu engeli kaldırıldı', 'info');
    } else {
      showToast(t('shops_toast_block_remove_error'), 'error');
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    color: '#d1d5db', fontSize: 13, outline: 'none',
  };

  const sectionLabel: React.CSSProperties = {
    color: '#6b7280', fontSize: 12, fontWeight: 500,
    display: 'block', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>{t('shops_title')}</h1>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>{t('shops_subtitle')}</p>
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
            {t('shops_new')}
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
            <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>{t('shops_empty_title')}</p>
            <p style={{ color: '#4b5563', fontSize: 13, margin: '6px 0 0' }}>{t('shops_empty_desc')}</p>
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
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setGuideShop(shop)}
                      style={{
                        background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: 8, padding: '6px 14px', color: '#a78bfa', fontSize: 13,
                        fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      {t('shops_setup_guide')}
                    </button>
                    {deleteConfirm === shop.id ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: '#f87171', fontSize: 13 }}>{t('are_you_sure')}</span>
                        <button
                          onClick={() => handleDelete(shop.id)}
                          style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '6px 14px', color: '#f87171', fontSize: 13, cursor: 'pointer' }}
                        >
                          {t('yes_delete')}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(shop.id)}
                        style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 14px', color: '#f87171', fontSize: 13, cursor: 'pointer' }}
                      >
                        {t('delete')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Webhook Secret */}
                <div style={{ marginBottom: 16 }}>
                  <label style={sectionLabel}>{t('shops_webhook_secret')}</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      readOnly
                      value={secretVisible[shop.id] ? (shop.webhookSecret || '—') : '••••••••••••••••••••••••••••••••'}
                      style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                    />
                    <button
                      onClick={() => setSecretVisible(prev => ({ ...prev, [shop.id]: !prev[shop.id] }))}
                      style={{ ...inputStyle, whiteSpace: 'nowrap', cursor: 'pointer', color: '#9ca3af' }}
                    >
                      {secretVisible[shop.id] ? t('hide') : t('show')}
                    </button>
                    <button
                      onClick={() => { if (shop.webhookSecret) navigator.clipboard.writeText(shop.webhookSecret); }}
                      style={{ ...inputStyle, whiteSpace: 'nowrap', cursor: 'pointer', color: '#9ca3af' }}
                    >
                      {t('copy')}
                    </button>
                  </div>
                </div>

                {/* SMS Template */}
                <div style={{ marginBottom: 16 }}>
                  {templateOpen[shop.id] ? (
                    <div>
                      <label style={sectionLabel}>{t('shops_sms_template')}</label>
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
                          {templateSaving[shop.id] ? t('saving') : t('save')}
                        </button>
                        <button
                          onClick={() => setTemplateOpen(prev => ({ ...prev, [shop.id]: false }))}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 18px', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <label style={sectionLabel}>{t('shops_sms_template')}</label>
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
                        {t('edit')}
                      </button>
                    </div>
                  )}
                </div>

                {/* SMS Schedule */}
                <div style={{ marginBottom: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                  {scheduleOpen[shop.id] ? (
                    <div>
                      <label style={sectionLabel}>{t('shops_sms_hours')}</label>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#9ca3af', fontSize: 13 }}>{t('shops_start')}</span>
                          <select
                            value={scheduleEdit[shop.id]?.start ?? shop.smsStartHour}
                            onChange={e => setScheduleEdit(prev => ({ ...prev, [shop.id]: { ...prev[shop.id], start: parseInt(e.target.value) } }))}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                          >
                            {hourOptions.map(h => (
                              <option key={h} value={h}>{padHour(h)}:00</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#9ca3af', fontSize: 13 }}>{t('shops_end')}</span>
                          <select
                            value={scheduleEdit[shop.id]?.end ?? shop.smsEndHour}
                            onChange={e => setScheduleEdit(prev => ({ ...prev, [shop.id]: { ...prev[shop.id], end: parseInt(e.target.value) } }))}
                            style={{ ...inputStyle, cursor: 'pointer' }}
                          >
                            {hourOptions.map(h => (
                              <option key={h} value={h}>{padHour(h)}:00</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleSaveSchedule(shop.id)}
                          disabled={scheduleSaving[shop.id]}
                          style={{
                            background: scheduleSaving[shop.id] ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            border: 'none', borderRadius: 8, padding: '8px 18px',
                            color: '#fff', fontSize: 13, fontWeight: 600, cursor: scheduleSaving[shop.id] ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {scheduleSaving[shop.id] ? t('saving') : t('save')}
                        </button>
                        <button
                          onClick={() => setScheduleOpen(prev => ({ ...prev, [shop.id]: false }))}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 18px', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <label style={sectionLabel}>{t('shops_sms_hours')}</label>
                        <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
                          {padHour(shop.smsStartHour ?? 9)}:00 — {padHour(shop.smsEndHour ?? 21)}:00
                        </p>
                      </div>
                      <button
                        onClick={() => openSchedule(shop)}
                        style={{
                          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
                          borderRadius: 8, padding: '8px 16px', color: '#a78bfa', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 16,
                        }}
                      >
                        {t('edit')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Blocked Phones */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: blockOpen[shop.id] ? 12 : 0 }}>
                    <div>
                      <label style={{ ...sectionLabel, marginBottom: 0 }}>{t('shops_blocked_phones')}</label>
                      {!blockOpen[shop.id] && (
                        <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0' }}>
                          {blockedPhones[shop.id]?.length
                            ? `${blockedPhones[shop.id].length} ${t('shops_blocked_count')}`
                            : t('shops_no_blocked')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleBlockSection(shop.id)}
                      style={{
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: 8, padding: '8px 16px', color: '#f87171', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 16,
                      }}
                    >
                      {blockOpen[shop.id] ? t('close') : t('manage')}
                    </button>
                  </div>

                  {blockOpen[shop.id] && (
                    <div>
                      {/* Add phone */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <input
                          value={blockInput[shop.id] ?? ''}
                          onChange={e => setBlockInput(prev => ({ ...prev, [shop.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddBlocked(shop.id); }}
                          placeholder="+905xxxxxxxxx"
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                          onClick={() => handleAddBlocked(shop.id)}
                          disabled={blockLoading[shop.id]}
                          style={{
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 8, padding: '10px 16px', color: '#f87171', fontSize: 13,
                            fontWeight: 600, cursor: blockLoading[shop.id] ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          {blockLoading[shop.id] ? '...' : t('shops_add_block')}
                        </button>
                      </div>

                      {/* List */}
                      {(blockedPhones[shop.id] ?? []).length === 0 ? (
                        <p style={{ color: '#4b5563', fontSize: 13, margin: 0 }}>{t('shops_no_blocked')}</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(blockedPhones[shop.id] ?? []).map(b => (
                            <div key={b.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
                              borderRadius: 8, padding: '8px 14px',
                            }}>
                              <span style={{ color: '#f87171', fontSize: 13, fontFamily: 'monospace' }}>{b.phone}</span>
                              <button
                                onClick={() => handleRemoveBlocked(shop.id, b.phone)}
                                style={{
                                  background: 'none', border: 'none', color: '#6b7280',
                                  fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Blocked Postal Codes */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: postalOpen[shop.id] ? 12 : 0 }}>
                    <div>
                      <label style={{ ...sectionLabel, marginBottom: 0 }}>Engellenen Posta Kodları</label>
                      {!postalOpen[shop.id] && (
                        <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0' }}>
                          {blockedPostalCodes[shop.id]?.length
                            ? `${blockedPostalCodes[shop.id].length} posta kodu engellendi`
                            : 'Engellenen posta kodu yok'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => togglePostalSection(shop.id)}
                      style={{
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: 8, padding: '8px 16px', color: '#f87171', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 16,
                      }}
                    >
                      {postalOpen[shop.id] ? t('close') : t('manage')}
                    </button>
                  </div>

                  {postalOpen[shop.id] && (
                    <div>
                      {/* Add postal code */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <input
                          value={newPostalCode[shop.id] ?? ''}
                          onChange={e => setNewPostalCode(prev => ({ ...prev, [shop.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') addPostalCode(shop.id); }}
                          placeholder="34xxx"
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                          onClick={() => addPostalCode(shop.id)}
                          disabled={postalLoading[shop.id]}
                          style={{
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 8, padding: '10px 16px', color: '#f87171', fontSize: 13,
                            fontWeight: 600, cursor: postalLoading[shop.id] ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          {postalLoading[shop.id] ? '...' : 'Ekle'}
                        </button>
                      </div>

                      {/* List */}
                      {(blockedPostalCodes[shop.id] ?? []).length === 0 ? (
                        <p style={{ color: '#4b5563', fontSize: 13, margin: 0 }}>Engellenen posta kodu yok</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(blockedPostalCodes[shop.id] ?? []).map(b => (
                            <div key={b.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
                              borderRadius: 8, padding: '8px 14px',
                            }}>
                              <span style={{ color: '#f87171', fontSize: 13, fontFamily: 'monospace' }}>{b.postalCode}</span>
                              <button
                                onClick={() => removePostalCode(shop.id, b.postalCode)}
                                style={{
                                  background: 'none', border: 'none', color: '#6b7280',
                                  fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ön Ödeme Ayarları */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                    Ön Ödeme Teşviki
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <div
                        onClick={() => updatePrepaid(shop.id, !shop.prepaidEnabled, shop.prepaidDiscount)}
                        style={{
                          width: 40, height: 22, borderRadius: 11,
                          background: shop.prepaidEnabled ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                          position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 3, left: shop.prepaidEnabled ? 21 : 3,
                          width: 16, height: 16, borderRadius: '50%', background: '#fff',
                          transition: 'left 0.2s',
                        }} />
                      </div>
                      <span style={{ color: shop.prepaidEnabled ? '#a855f7' : '#6b7280', fontSize: 13 }}>
                        {shop.prepaidEnabled ? 'Aktif' : 'Kapalı'}
                      </span>
                    </label>
                    {shop.prepaidEnabled && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[5, 10, 15].map(pct => (
                          <button
                            key={pct}
                            onClick={() => updatePrepaid(shop.id, true, pct)}
                            style={{
                              padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13,
                              background: shop.prepaidDiscount === pct ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                              color: shop.prepaidDiscount === pct ? '#a855f7' : '#6b7280',
                            }}
                          >
                            %{pct}
                          </button>
                        ))}
                      </div>
                    )}
                    {prepaidSaving[shop.id] && <span style={{ color: '#6b7280', fontSize: 12 }}>Kaydediliyor...</span>}
                  </div>
                </div>
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
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 24px' }}>{t('shops_modal_title')}</h2>
            {createError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 14, marginBottom: 16 }}>
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{t('shops_name_label')}</label>
                <input
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={t('shops_name_placeholder')}
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
                <label style={{ display: 'block', color: '#9ca3af', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{t('shops_domain_label')}</label>
                <input
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  placeholder={t('shops_domain_placeholder')}
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
                  {creating ? t('creating') : t('create')}
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
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
