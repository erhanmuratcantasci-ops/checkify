'use client';

import { useEffect, useState, useCallback } from 'react';
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
  type: 'PURCHASE' | 'USAGE' | 'WHATSAPP_PURCHASE';
  description: string;
  price?: number;
  createdAt: string;
}

const SMS_PRESETS = [100, 250, 500, 1000];
const WA_PRESETS = [100, 250, 500, 1000];
const SMS_UNIT = 0.25;
const WA_UNIT = 0.15;

export default function CreditsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [credits, setCredits] = useState<number | null>(null);
  const [whatsappCredits, setWhatsappCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('FREE');
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState<'sms' | 'whatsapp'>('sms');
  const [smsAmount, setSmsAmount] = useState<number>(100);
  const [smsCustom, setSmsCustom] = useState('');
  const [smsCustomMode, setSmsCustomMode] = useState(false);
  const [waAmount, setWaAmount] = useState<number>(100);
  const [waCustom, setWaCustom] = useState('');
  const [waCustomMode, setWaCustomMode] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    Promise.all([
      fetch(`${API}/credits`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/plans/current`, { headers: authHeaders() }).then(r => r.json()),
    ])
      .then(([data, planData]) => {
        setCredits(data.smsCredits ?? 0);
        setWhatsappCredits(data.whatsappCredits ?? 0);
        setTransactions(data.transactions || []);
        setUserPlan(planData.plan ?? 'FREE');
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const refreshCredits = useCallback(async () => {
    const res = await fetch(`${API}/credits`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setCredits(data.smsCredits ?? 0);
      setWhatsappCredits(data.whatsappCredits ?? 0);
      setTransactions(data.transactions || []);
    }
  }, []);

  async function downloadInvoice(transactionId: number) {
    try {
      const res = await fetch(`${API}/credits/invoice/${transactionId}`, { headers: authHeaders() });
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

  async function purchaseExtra(type: 'sms' | 'whatsapp') {
    if (userPlan === 'FREE') { router.push('/pricing'); return; }
    const raw = type === 'sms' ? (smsCustomMode ? parseInt(smsCustom) : smsAmount) : (waCustomMode ? parseInt(waCustom) : waAmount);
    const amount = raw;
    if (!amount || isNaN(amount) || amount < 100) { showToast('Minimum 100 adet satın alınabilir', 'error'); return; }
    setPurchasing(true);
    try {
      const res = await fetch(`${API}/credits/extra`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ type, amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.upgrade) { router.push('/pricing'); return; }
        showToast(data.error || 'Satın alma başarısız', 'error'); return;
      }
      showToast(`${amount} ${type === 'whatsapp' ? 'WhatsApp' : 'SMS'} kredisi eklendi! (${data.totalPrice}₺)`, 'success');
      await refreshCredits();
    } catch {
      showToast('Satın alma başarısız', 'error');
    } finally {
      setPurchasing(false);
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

        {/* Extra Credit Purchase Section */}
        {userPlan === 'FREE' ? (
          <div style={{
            background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: 28 }}>🔒</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Ekstra Kredi Satın Al</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>Ekstra kredi almak için aktif bir plan gerekli.</div>
            </div>
            <button
              onClick={() => router.push('/pricing')}
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Plan Satın Al →
            </button>
          </div>
        ) : (
          <>
          {/* SMS Extra Credits */}
          {activeTab === 'sms' && (
          <div style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>📱</span>
              <h2 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: 0 }}>Ekstra SMS Kredisi</h2>
              <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 4 }}>0.25₺ / SMS</span>
            </div>
            {/* Presets */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {SMS_PRESETS.map(n => (
                <button
                  key={n}
                  onClick={() => { setSmsAmount(n); setSmsCustomMode(false); setSmsCustom(''); }}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid',
                    borderColor: !smsCustomMode && smsAmount === n ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)',
                    background: !smsCustomMode && smsAmount === n ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                    color: !smsCustomMode && smsAmount === n ? '#c4b5fd' : '#9ca3af',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {n} SMS
                </button>
              ))}
              <button
                onClick={() => { setSmsCustomMode(true); setSmsCustom(''); }}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid',
                  borderColor: smsCustomMode ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)',
                  background: smsCustomMode ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                  color: smsCustomMode ? '#c4b5fd' : '#9ca3af',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Özel Miktar
              </button>
            </div>
            {smsCustomMode && (
              <input
                type="number" min="100" placeholder="Min. 100 adet"
                value={smsCustom} onChange={e => setSmsCustom(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ color: '#6b7280', fontSize: 13 }}>Toplam: </span>
                <span style={{ color: '#a78bfa', fontSize: 20, fontWeight: 800 }}>
                  {((smsCustomMode ? (parseInt(smsCustom) || 0) : smsAmount) * SMS_UNIT).toFixed(2)}₺
                </span>
                <span style={{ color: '#4b5563', fontSize: 12, marginLeft: 6 }}>
                  ({smsCustomMode ? (parseInt(smsCustom) || 0) : smsAmount} SMS × {SMS_UNIT}₺)
                </span>
              </div>
              <button
                onClick={() => purchaseExtra('sms')}
                disabled={purchasing || (smsCustomMode && (!parseInt(smsCustom) || parseInt(smsCustom) < 100))}
                style={{
                  padding: '11px 28px', background: purchasing ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: purchasing ? 'not-allowed' : 'pointer', minHeight: 44,
                }}
              >
                {purchasing ? 'İşleniyor...' : 'Satın Al'}
              </button>
            </div>
          </div>
          )}

          {/* WhatsApp Extra Credits */}
          {activeTab === 'whatsapp' && (
          <div style={{ background: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>💬</span>
              <h2 style={{ color: '#e5e7eb', fontSize: 15, fontWeight: 700, margin: 0 }}>Ekstra WhatsApp Kredisi</h2>
              <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 4 }}>0.15₺ / WP</span>
            </div>
            {/* Presets */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {WA_PRESETS.map(n => (
                <button
                  key={n}
                  onClick={() => { setWaAmount(n); setWaCustomMode(false); setWaCustom(''); }}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid',
                    borderColor: !waCustomMode && waAmount === n ? 'rgba(37,211,102,0.6)' : 'rgba(255,255,255,0.1)',
                    background: !waCustomMode && waAmount === n ? 'rgba(37,211,102,0.2)' : 'rgba(255,255,255,0.03)',
                    color: !waCustomMode && waAmount === n ? '#4ade80' : '#9ca3af',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {n} WP
                </button>
              ))}
              <button
                onClick={() => { setWaCustomMode(true); setWaCustom(''); }}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid',
                  borderColor: waCustomMode ? 'rgba(37,211,102,0.6)' : 'rgba(255,255,255,0.1)',
                  background: waCustomMode ? 'rgba(37,211,102,0.2)' : 'rgba(255,255,255,0.03)',
                  color: waCustomMode ? '#4ade80' : '#9ca3af',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Özel Miktar
              </button>
            </div>
            {waCustomMode && (
              <input
                type="number" min="100" placeholder="Min. 100 adet"
                value={waCustom} onChange={e => setWaCustom(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ color: '#6b7280', fontSize: 13 }}>Toplam: </span>
                <span style={{ color: '#4ade80', fontSize: 20, fontWeight: 800 }}>
                  {((waCustomMode ? (parseInt(waCustom) || 0) : waAmount) * WA_UNIT).toFixed(2)}₺
                </span>
                <span style={{ color: '#4b5563', fontSize: 12, marginLeft: 6 }}>
                  ({waCustomMode ? (parseInt(waCustom) || 0) : waAmount} WP × {WA_UNIT}₺)
                </span>
              </div>
              <button
                onClick={() => purchaseExtra('whatsapp')}
                disabled={purchasing || (waCustomMode && (!parseInt(waCustom) || parseInt(waCustom) < 100))}
                style={{
                  padding: '11px 28px', background: purchasing ? 'rgba(37,211,102,0.3)' : 'linear-gradient(135deg, #16a34a, #22c55e)',
                  border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: purchasing ? 'not-allowed' : 'pointer', minHeight: 44,
                }}
              >
                {purchasing ? 'İşleniyor...' : 'Satın Al'}
              </button>
            </div>
          </div>
          )}
          </>
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
                      background: tx.type === 'PURCHASE' ? 'rgba(5,150,105,0.12)' : tx.type === 'WHATSAPP_PURCHASE' ? 'rgba(37,211,102,0.12)' : 'rgba(139,92,246,0.12)',
                    }}>
                      {tx.type === 'PURCHASE' ? '💳' : tx.type === 'WHATSAPP_PURCHASE' ? '💬' : '📱'}
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
                      color: tx.type === 'PURCHASE' ? '#34d399' : tx.type === 'WHATSAPP_PURCHASE' ? '#4ade80' : '#a78bfa',
                    }}>
                      {(tx.type === 'PURCHASE' || tx.type === 'WHATSAPP_PURCHASE') ? '+' : ''}{tx.amount}
                    </div>
                    {(tx.type === 'PURCHASE' || tx.type === 'WHATSAPP_PURCHASE') && (
                      ['STARTER', 'PRO', 'BUSINESS'].includes(userPlan) ? (
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
                      ) : (
                        <button
                          onClick={() => router.push('/pricing')}
                          style={{
                            background: 'rgba(107,114,128,0.1)',
                            border: '1px solid rgba(107,114,128,0.25)',
                            borderRadius: 6, padding: '4px 10px',
                            color: '#6b7280', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', marginLeft: 10, whiteSpace: 'nowrap',
                          }}
                          title="Starter plan gerekli"
                        >
                          🔒 PDF
                        </button>
                      )
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
