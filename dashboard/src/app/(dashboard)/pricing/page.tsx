'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GeometricBackground from '@/components/GeometricBackground';
import { useIsMobile } from '@/hooks/useIsMobile';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';

interface PlanConfig {
  price: number;
  yearlyPrice: number;
  shops: number;
  smsCreditsMonthly: number;
  features: string[];
  label: string;
}

const PLAN_FEATURES: Record<string, string> = {
  basic_sms: 'SMS Doğrulama',
  otp: 'OTP Kodu Doğrulama',
  pdf_invoice: 'PDF Fatura',
  whatsapp: 'WhatsApp Bildirimi',
  rto: 'RTO Analizi',
  blocklist: 'Telefon Kara Listesi',
  postal_code: 'Posta Kodu Engeli',
  priority_support: 'Öncelikli Destek',
};

const PLAN_COLORS: Record<PlanType, { accent: string; badge: string; bg: string }> = {
  FREE:     { accent: '#6b7280', badge: 'rgba(107,114,128,0.15)', bg: 'rgba(107,114,128,0.05)' },
  STARTER:  { accent: '#3b82f6', badge: 'rgba(59,130,246,0.15)',  bg: 'rgba(59,130,246,0.05)' },
  PRO:      { accent: '#a855f7', badge: 'rgba(168,85,247,0.15)',  bg: 'rgba(168,85,247,0.05)' },
  BUSINESS: { accent: '#f59e0b', badge: 'rgba(245,158,11,0.15)',  bg: 'rgba(245,158,11,0.05)' },
};

const ALL_FEATURES = ['basic_sms', 'otp', 'pdf_invoice', 'whatsapp', 'rto', 'blocklist', 'postal_code', 'priority_support'];

export default function PricingPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<Record<PlanType, PlanConfig> | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('FREE');
  const [upgrading, setUpgrading] = useState<PlanType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
    if (!token) { router.push('/login'); return; }

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/plans`, { headers }).then(r => r.json()),
      fetch(`${API}/plans/current`, { headers }).then(r => r.json()),
    ]).then(([plansData, currentData]) => {
      setPlans(plansData.plans);
      setCurrentPlan(currentData.plan ?? 'FREE');
      setBilling(currentData.billingCycle ?? 'monthly');
    }).catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleUpgrade(plan: PlanType) {
    if (plan === currentPlan) return;
    setUpgrading(plan);
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
    const res = await fetch(`${API}/plans/upgrade`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, billingCycle: billing }),
    });
    const data = await res.json();
    if (res.ok) {
      setCurrentPlan(plan);
      alert(`✅ ${data.message}`);
    }
    setUpgrading(null);
  }

  const planOrder: PlanType[] = ['FREE', 'STARTER', 'PRO', 'BUSINESS'];
  const pad = isMobile ? '20px 16px' : '40px 24px';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <GeometricBackground />      <main style={{ maxWidth: 1200, margin: '0 auto', padding: pad }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 40 }}>
          <h1 style={{
            fontSize: isMobile ? 26 : 36, fontWeight: 700, color: '#fff',
            fontFamily: "'Syne', sans-serif", margin: '0 0 10px', letterSpacing: '-0.5px',
          }}>Planlar & Fiyatlandırma</h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 24px' }}>
            İşletmenize uygun planı seçin
          </p>

          {/* Monthly/Yearly Toggle */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 30, padding: '4px',
          }}>
            {(['monthly', 'yearly'] as const).map(cycle => (
              <button
                key={cycle}
                onClick={() => setBilling(cycle)}
                style={{
                  padding: '8px 20px', borderRadius: 26, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
                  background: billing === cycle ? 'rgba(139,92,246,0.3)' : 'transparent',
                  color: billing === cycle ? '#c4b5fd' : '#6b7280',
                }}
              >
                {cycle === 'monthly' ? 'Aylık' : 'Yıllık'}
                {cycle === 'yearly' && (
                  <span style={{
                    marginLeft: 6, fontSize: 11, background: '#059669',
                    color: '#fff', padding: '1px 7px', borderRadius: 10,
                  }}>%20 indirim</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Cards */}
        {loading || !plans ? (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px 0' }}>Yükleniyor...</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? 12 : 16,
          }}>
            {planOrder.map(planKey => {
              const config = plans[planKey];
              const colors = PLAN_COLORS[planKey];
              const isCurrent = currentPlan === planKey;
              const isPro = planKey === 'PRO';
              const price = billing === 'yearly' ? config.yearlyPrice : config.price;

              return (
                <div key={planKey} style={{
                  background: isPro ? `linear-gradient(135deg, rgba(124,58,237,0.1), rgba(168,85,247,0.05))` : 'rgba(255,255,255,0.03)',
                  border: isCurrent ? `2px solid ${colors.accent}` : isPro ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  padding: isMobile ? '20px 18px' : '28px 20px',
                  position: 'relative',
                  display: 'flex', flexDirection: 'column',
                }}>
                  {isPro && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 14px',
                      borderRadius: 20, whiteSpace: 'nowrap',
                    }}>EN POPÜLER</div>
                  )}
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      background: colors.badge, color: colors.accent,
                      fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                    }}>Aktif</div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: colors.accent, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      {config.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ color: '#fff', fontSize: isMobile ? 28 : 32, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>
                        {price === 0 ? 'Ücretsiz' : `${price}₺`}
                      </span>
                      {price > 0 && (
                        <span style={{ color: '#6b7280', fontSize: 13 }}>/ {billing === 'monthly' ? 'ay' : 'yıl'}</span>
                      )}
                    </div>
                    {billing === 'yearly' && price > 0 && (
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                        Normalde {config.price}₺/ay
                      </div>
                    )}
                  </div>

                  <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>🏪 {config.shops === -1 ? 'Sınırsız' : config.shops} mağaza</div>
                    <div style={{ marginTop: 4 }}>📱 {config.smsCreditsMonthly} SMS/ay</div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {ALL_FEATURES.map(feat => {
                      const included = config.features.includes(feat);
                      return (
                        <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, color: included ? '#059669' : '#374151' }}>
                            {included ? '✓' : '✗'}
                          </span>
                          <span style={{ fontSize: 13, color: included ? '#d1d5db' : '#4b5563' }}>
                            {PLAN_FEATURES[feat]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleUpgrade(planKey)}
                    disabled={isCurrent || upgrading !== null}
                    style={{
                      width: '100%', padding: '12px',
                      borderRadius: 12, border: 'none', cursor: isCurrent ? 'default' : 'pointer',
                      fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
                      background: isCurrent
                        ? 'rgba(255,255,255,0.05)'
                        : isPro
                          ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                          : `${colors.bg}`,
                      color: isCurrent ? '#4b5563' : isPro ? '#fff' : colors.accent,
                      outline: !isCurrent && !isPro ? `1px solid ${colors.accent}40` : 'none',
                    }}
                  >
                    {upgrading === planKey ? 'Geçiliyor...' : isCurrent ? 'Mevcut Plan' : planKey === 'FREE' ? 'Düşür' : 'Yükselt'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
