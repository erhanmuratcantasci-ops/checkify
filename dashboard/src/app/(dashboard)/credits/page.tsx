'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GeometricBackground from '@/components/GeometricBackground';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

function getToken() {
  return document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1] ?? null;
}
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

interface Transaction {
  id: number;
  amount: number;
  type: 'PURCHASE' | 'USAGE';
  description: string;
  createdAt: string;
}

export default function CreditsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [credits, setCredits] = useState<number | null>(null);
  const [whatsappCredits, setWhatsappCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState<'sms' | 'whatsapp'>('sms');

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    fetch(`${API}/credits`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        setCredits(data.smsCredits ?? 0);
        setWhatsappCredits(data.whatsappCredits ?? 0);
        setTransactions(data.transactions || []);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function downloadInvoice(transactionId: number) {
    try {
      const res = await fetch(`${API}/credits/invoice/${transactionId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) { showToast('PDF indirilemedi', 'error'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chekkify-fatura-${transactionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('PDF indirilemedi', 'error');
    }
  }

  async function purchaseWhatsapp(amount: number) {
    try {
      const res = await fetch(`${API}/credits/add`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ amount, type: 'whatsapp' }),
      });
      if (!res.ok) { showToast('Satın alma başarısız', 'error'); return; }
      showToast(`${amount} WhatsApp kredisi eklendi!`, 'success');
      const res2 = await fetch(`${API}/credits`, { headers: authHeaders() });
      if (res2.ok) {
        const data = await res2.json();
        setWhatsappCredits(data.whatsappCredits ?? 0);
        setTransactions(data.transactions || []);
      }
    } catch {
      showToast('Satın alma başarısız', 'error');
    }
  }

  const pad = isMobile ? '16px' : '40px 24px';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", position: 'relative' }}>
      <GeometricBackground />
      <Navbar />

      <main style={{ maxWidth: 760, margin: '0 auto', padding: pad }}>
        <div style={{ marginBottom: isMobile ? 20 : 32 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 10 }}
          >
            {t('back_dashboard')}
          </button>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>{t('credits_title')}</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>{t('credits_subtitle')}</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['sms', 'whatsapp'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: activeTab === tab ? (tab === 'whatsapp' ? 'rgba(37,211,102,0.2)' : 'rgba(139,92,246,0.2)') : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? (tab === 'whatsapp' ? '#4ade80' : '#a855f7') : '#6b7280',
              }}
            >
              {tab === 'sms' ? '📱 SMS Kredileri' : '💬 WhatsApp Kredileri'}
            </button>
          ))}
        </div>

        {/* Credit balance card */}
        <div style={{
          background: activeTab === 'whatsapp' ? 'rgba(37,211,102,0.06)' : 'rgba(139,92,246,0.06)',
          border: `1px solid ${activeTab === 'whatsapp' ? 'rgba(37,211,102,0.25)' : 'rgba(139,92,246,0.25)'}`,
          borderRadius: 20, padding: isMobile ? '24px 20px' : '36px 32px',
          marginBottom: 20, position: 'relative', overflow: 'hidden',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between', gap: isMobile ? 20 : 24,
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: activeTab === 'whatsapp'
              ? 'radial-gradient(circle, rgba(37,211,102,0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div>
            <div style={{ color: '#9ca3af', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
              {t('credits_current')}
            </div>
            {loading ? (
              <div style={{ width: 80, height: 48, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
            ) : (
              <div style={{
                fontSize: isMobile ? 42 : 56, fontWeight: 900, lineHeight: 1,
                background: activeTab === 'whatsapp'
                  ? 'linear-gradient(135deg, #22c55e, #4ade80, #86efac)'
                  : 'linear-gradient(135deg, #7c3aed, #a855f7, #c084fc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                letterSpacing: '-2px',
              }}>
                {activeTab === 'whatsapp' ? whatsappCredits.toLocaleString('tr-TR') : credits?.toLocaleString('tr-TR')}
              </div>
            )}
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 6 }}>{t('credits_remaining')}</div>
          </div>

          <div style={{ position: 'relative', flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
            <button
              onMouseEnter={() => !isMobile && activeTab === 'sms' && setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => isMobile && activeTab === 'sms' && setShowTooltip(v => !v)}
              style={{
                padding: '13px 28px',
                background: activeTab === 'whatsapp' ? 'rgba(37,211,102,0.15)' : 'rgba(139,92,246,0.15)',
                border: `1px solid ${activeTab === 'whatsapp' ? 'rgba(37,211,102,0.35)' : 'rgba(139,92,246,0.35)'}`,
                borderRadius: 12, color: activeTab === 'whatsapp' ? '#4ade80' : '#a78bfa',
                fontSize: 14, fontWeight: 600, cursor: activeTab === 'sms' ? 'not-allowed' : 'default',
                width: isMobile ? '100%' : 'auto', minHeight: 44,
              }}
            >
              {t('credits_buy')}
            </button>
            {showTooltip && activeTab === 'sms' && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
                background: 'rgba(15,15,28,0.98)', border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 8, padding: '8px 14px',
                color: '#c4b5fd', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 10,
              }}>
                {t('credits_coming_soon')}
                <div style={{
                  position: 'absolute', bottom: -5, right: 20,
                  width: 10, height: 10, background: 'rgba(15,15,28,0.98)',
                  border: '1px solid rgba(139,92,246,0.3)', borderTop: 'none', borderLeft: 'none',
                  transform: 'rotate(45deg)',
                }} />
              </div>
            )}
          </div>
        </div>

        {/* SMS Packages — 3 col desktop, 1 col mobile */}
        {activeTab === 'sms' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: '100 SMS', price: '₺49', badge: null },
            { label: '500 SMS', price: '₺199', badge: t('landing_pkg_popular') },
            { label: '2000 SMS', price: '₺599', badge: t('landing_pkg_pro') },
          ].map(pkg => (
            <div key={pkg.label} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: isMobile ? '16px 20px' : '20px 18px',
              textAlign: isMobile ? 'left' : 'center',
              position: 'relative', opacity: 0.6,
              display: isMobile ? 'flex' : 'block',
              alignItems: 'center', justifyContent: 'space-between',
            }}>
              {pkg.badge && !isMobile && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700,
                  color: '#fff', whiteSpace: 'nowrap',
                }}>
                  {pkg.badge}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 0, flexDirection: isMobile ? 'row' : 'column' }}>
                {pkg.badge && isMobile && (
                  <span style={{
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#fff',
                  }}>{pkg.badge}</span>
                )}
                <div style={{ color: '#e5e7eb', fontSize: 16, fontWeight: 700, marginBottom: isMobile ? 0 : 4 }}>{pkg.label}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ color: '#a78bfa', fontSize: 20, fontWeight: 800 }}>{pkg.price}</div>
                {isMobile && <div style={{ color: '#4b5563', fontSize: 11 }}>{t('credits_coming_soon_label')}</div>}
              </div>
              {!isMobile && <div style={{ color: '#4b5563', fontSize: 11, marginTop: 6 }}>{t('credits_coming_soon_label')}</div>}
            </div>
          ))}
        </div>
        )}

        {/* WhatsApp Packages */}
        {activeTab === 'whatsapp' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: '100 WP', amount: 100, price: '50₺', badge: null },
            { label: '250 WP', amount: 250, price: '115₺', badge: 'Popüler' },
            { label: '500 WP', amount: 500, price: '210₺', badge: 'Pro' },
          ].map(pkg => (
            <div key={pkg.label} style={{
              background: 'rgba(37,211,102,0.03)', border: '1px solid rgba(37,211,102,0.15)',
              borderRadius: 14, padding: isMobile ? '16px 20px' : '20px 18px',
              textAlign: isMobile ? 'left' : 'center',
              position: 'relative',
              display: isMobile ? 'flex' : 'block',
              alignItems: 'center', justifyContent: 'space-between',
            }}>
              {pkg.badge && !isMobile && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #22c55e, #4ade80)',
                  borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700,
                  color: '#fff', whiteSpace: 'nowrap',
                }}>
                  {pkg.badge}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 0, flexDirection: isMobile ? 'row' : 'column' }}>
                {pkg.badge && isMobile && (
                  <span style={{
                    background: 'linear-gradient(135deg, #22c55e, #4ade80)',
                    borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#fff',
                  }}>{pkg.badge}</span>
                )}
                <div style={{ color: '#e5e7eb', fontSize: 16, fontWeight: 700, marginBottom: isMobile ? 0 : 4 }}>{pkg.label}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isMobile ? 'row' : 'column', marginTop: isMobile ? 0 : 8 }}>
                <div style={{ color: '#4ade80', fontSize: 20, fontWeight: 800 }}>{pkg.price}</div>
                <button
                  onClick={() => purchaseWhatsapp(pkg.amount)}
                  style={{
                    padding: isMobile ? '6px 14px' : '8px 20px',
                    background: 'rgba(37,211,102,0.15)',
                    border: '1px solid rgba(37,211,102,0.35)',
                    borderRadius: 8, color: '#4ade80',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Satın Al
                </button>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Transaction history */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
              {t('credits_transactions')}
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 6, marginBottom: 14, width: `${70 + i * 8}%` }} />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#4b5563', fontSize: 14 }}>{t('credits_no_transactions')}</div>
          ) : (
            <div>
              {transactions.map((tx, i) => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: isMobile ? '12px 16px' : '14px 24px',
                  borderBottom: i < transactions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                      background: tx.type === 'PURCHASE' ? 'rgba(5,150,105,0.12)' : 'rgba(139,92,246,0.12)',
                    }}>
                      {tx.type === 'PURCHASE' ? '💳' : '📱'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                      <div style={{ color: '#4b5563', fontSize: 11, marginTop: 2 }}>
                        {new Date(tx.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 700,
                      color: tx.type === 'PURCHASE' ? '#34d399' : '#a78bfa',
                    }}>
                      {tx.type === 'PURCHASE' ? '+' : ''}{tx.amount}
                    </div>
                    {tx.type === 'PURCHASE' && (
                      <button
                        onClick={() => downloadInvoice(tx.id)}
                        style={{
                          background: 'rgba(139,92,246,0.1)',
                          border: '1px solid rgba(139,92,246,0.25)',
                          borderRadius: 6, padding: '4px 10px',
                          color: '#a78bfa', fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', marginLeft: 10, whiteSpace: 'nowrap',
                        }}
                      >
                        PDF İndir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
