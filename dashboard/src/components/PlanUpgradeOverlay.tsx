'use client';

import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PlanCard {
  label: string;
  price: string;
  features: string[];
  accent: string;
  bg: string;
  border: string;
}

const UPGRADE_PLANS: Record<string, PlanCard> = {
  STARTER: {
    label: 'Starter',
    price: '99₺/ay',
    features: ['500 SMS/ay', '3 mağaza', 'OTP doğrulama', 'WhatsApp bildirimi'],
    accent: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.3)',
  },
  PRO: {
    label: 'Pro',
    price: '249₺/ay',
    features: ['2.000 SMS/ay', '10 mağaza', 'RTO analizi', 'PDF fatura'],
    accent: '#a855f7',
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.3)',
  },
  BUSINESS: {
    label: 'Business',
    price: '499₺/ay',
    features: ['5.000 SMS/ay', 'Sınırsız mağaza', 'API erişimi', 'Öncelikli destek'],
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.3)',
  },
};

interface Props {
  featureName?: string;
  requiredPlan?: 'STARTER' | 'PRO' | 'BUSINESS';
}

export default function PlanUpgradeOverlay({ featureName, requiredPlan }: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();

  // Show plans at and above requiredPlan; default to all 3
  const planOrder = ['STARTER', 'PRO', 'BUSINESS'];
  const startIdx = requiredPlan ? planOrder.indexOf(requiredPlan) : 0;
  const visiblePlans = planOrder.slice(startIdx);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,10,15,0.93)',
      backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
      fontFamily: "'Outfit', sans-serif",
      overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 660, textAlign: 'center' }}>

        {/* Icon + title */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 20px',
        }}>
          🔒
        </div>
        <h2 style={{ color: '#fff', fontSize: isMobile ? 20 : 24, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
          Bu özellik planınızda mevcut değil
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px', maxWidth: 400, marginInline: 'auto', lineHeight: 1.6 }}>
          {featureName
            ? <><strong style={{ color: '#9ca3af' }}>{featureName}</strong> özelliğini kullanmak için planınızı yükseltin.</>
            : 'Bu özelliği kullanmak için planınızı yükseltin.'}
        </p>

        {/* Plan cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : `repeat(${visiblePlans.length}, 1fr)`,
          gap: isMobile ? 10 : 14,
          marginBottom: 24,
        }}>
          {visiblePlans.map(key => {
            const plan = UPGRADE_PLANS[key];
            return (
              <div key={key} style={{
                background: plan.bg, border: `1px solid ${plan.border}`,
                borderRadius: 16, padding: isMobile ? '16px' : '20px 18px',
                textAlign: 'left', display: 'flex', flexDirection: isMobile ? 'row' : 'column',
                gap: isMobile ? 14 : 12, alignItems: isMobile ? 'center' : 'stretch',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: plan.accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
                    {plan.label}
                  </div>
                  <div style={{ color: '#fff', fontSize: isMobile ? 18 : 22, fontWeight: 800, marginBottom: isMobile ? 0 : 10 }}>
                    {plan.price}
                  </div>
                  {!isMobile && (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {plan.features.map(f => (
                        <li key={f} style={{ color: '#9ca3af', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: plan.accent, fontWeight: 700, fontSize: 10 }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  onClick={() => router.push('/pricing')}
                  style={{
                    padding: isMobile ? '8px 16px' : '10px 14px',
                    borderRadius: 9, border: 'none', cursor: 'pointer',
                    background: plan.accent, color: '#fff',
                    fontSize: 12, fontWeight: 700,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    width: isMobile ? 'auto' : '100%',
                  }}
                >
                  Bu Planı Seç →
                </button>
              </div>
            );
          })}
        </div>

        {/* Close link */}
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'none', border: 'none',
            color: '#4b5563', fontSize: 13,
            cursor: 'pointer', textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Şimdilik kapat
        </button>
      </div>
    </div>
  );
}
