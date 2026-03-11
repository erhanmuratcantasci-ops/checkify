'use client';

import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const faqs = [
    { q: t('landing_faq_q1'), a: t('landing_faq_a1') },
    { q: t('landing_faq_q2'), a: t('landing_faq_a2') },
    { q: t('landing_faq_q3'), a: t('landing_faq_a3') },
    { q: t('landing_faq_q4'), a: t('landing_faq_a4') },
  ];

  const steps = [
    { num: '01', title: t('landing_step1_title'), desc: t('landing_step1_desc') },
    { num: '02', title: t('landing_step2_title'), desc: t('landing_step2_desc') },
    { num: '03', title: t('landing_step3_title'), desc: t('landing_step3_desc') },
  ];

  const plans = [
    { name: 'Başlangıç', credits: '100 SMS', price: '49', desc: 'Küçük mağazalar için ideal', features: ['100 doğrulama SMS\'i', 'Shopify entegrasyonu', 'Temel dashboard', 'E-posta destek'] },
    { name: 'Büyüme', credits: '500 SMS', price: '199', desc: 'Büyüyen işletmeler için', features: ['500 doğrulama SMS\'i', 'Shopify entegrasyonu', 'Gelişmiş dashboard', 'Öncelikli destek', 'İptal analitikleri'], popular: true },
    { name: t('landing_pkg_pro'), credits: '2000 SMS', price: '599', desc: 'Yüksek hacimli satıcılar için', features: ['2000 doğrulama SMS\'i', 'Shopify entegrasyonu', 'Tam dashboard', '7/24 destek', 'İptal analitikleri', 'API erişimi'] },
  ];

  const stats = [
    [t('landing_stat1_val'), t('landing_stat1_label')],
    [t('landing_stat2_val'), t('landing_stat2_label')],
    [t('landing_stat3_val'), t('landing_stat3_label')],
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", color: '#fff', position: 'relative' }}>
      <GeometricBackground />

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: isMobile ? '0 16px' : '0 40px',
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', gap: isMobile ? 8 : 12, alignItems: 'center' }}>
          <LanguageSwitcher />
          <Link href="/login" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>{t('landing_nav_login')}</Link>
          <Link href="/register" style={{
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', fontSize: isMobile ? 13 : 14, fontWeight: 600,
            padding: isMobile ? '7px 14px' : '8px 20px', borderRadius: 8,
            boxShadow: '0 4px 15px rgba(139,92,246,0.3)',
          }}>{t('landing_nav_start')}</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        maxWidth: 900, margin: '0 auto',
        padding: isMobile ? '64px 16px 56px' : '120px 24px 100px',
        textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 100, padding: '6px 16px', marginBottom: isMobile ? 20 : 32,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px #a855f7' }} />
          <span style={{ color: '#c4b5fd', fontSize: isMobile ? 12 : 13, fontWeight: 500 }}>{t('landing_badge')}</span>
        </div>
        <h1 style={{
          fontSize: isMobile ? 42 : 'clamp(58px, 6vw, 92px)',
          fontWeight: 900, lineHeight: 1.05, margin: isMobile ? '0 0 16px' : '0 0 24px',
          letterSpacing: isMobile ? '-0.5px' : '-1px', fontFamily: "'Outfit', sans-serif",
        }}>
          {t('landing_hero_line1')}<br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('landing_hero_line2')}</span>
        </h1>
        <p style={{
          fontSize: isMobile ? 16 : 22, color: '#9ca3af', lineHeight: 1.7,
          maxWidth: 640, margin: isMobile ? '0 auto 28px' : '0 auto 40px', fontWeight: 400,
        }}>
          {t('landing_hero_subtitle')}
        </p>
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
        }}>
          <Link href="/register" style={{
            textDecoration: 'none', background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', fontSize: isMobile ? 15 : 16, fontWeight: 700,
            padding: isMobile ? '14px 24px' : '14px 32px', borderRadius: 12,
            boxShadow: '0 8px 30px rgba(139,92,246,0.4)', display: 'inline-block',
            width: isMobile ? '100%' : 'auto', boxSizing: 'border-box' as const,
          }}>
            {t('landing_start_free')}
          </Link>
          <Link href="#how" style={{
            textDecoration: 'none', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb',
            fontSize: isMobile ? 15 : 16, fontWeight: 500,
            padding: isMobile ? '14px 24px' : '14px 32px', borderRadius: 12,
            display: 'inline-block',
            width: isMobile ? '100%' : 'auto', boxSizing: 'border-box' as const,
          }}>
            {t('landing_how_it_works')}
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: isMobile ? 24 : 48, justifyContent: 'center',
          marginTop: isMobile ? 48 : 72, flexWrap: 'wrap',
        }}>
          {stats.map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: isMobile ? 36 : 52, fontWeight: 800,
                background: 'linear-gradient(135deg, #c4b5fd, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{val}</div>
              <div style={{ color: '#6b7280', fontSize: isMobile ? 12 : 13, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '56px 16px' : '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 56 }}>
          <h2 style={{ fontSize: isMobile ? 32 : 60, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>{t('landing_how_title')}</h2>
          <p style={{ color: '#6b7280', fontSize: isMobile ? 15 : 36 }}>{t('landing_how_subtitle')}</p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 12 : 24,
        }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              background: '#0f0f18', border: '1px solid #1a1a2e',
              borderRadius: 20, padding: isMobile ? '24px 20px' : '32px 28px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -10, right: -10, fontSize: 64,
                fontWeight: 900, color: 'rgba(139,92,246,0.08)',
                fontFamily: "'Outfit', sans-serif", lineHeight: 1,
              }}>{step.num}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>{step.num}</div>
              <h3 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: '0 0 10px' }}>{step.title}</h3>
              <p style={{ color: '#6b7280', fontSize: isMobile ? 14 : 15, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '56px 16px' : '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 56 }}>
          <h2 style={{ fontSize: isMobile ? 32 : 60, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>{t('landing_pricing_title')}</h2>
          <p style={{ color: '#6b7280', fontSize: isMobile ? 15 : 36 }}>{t('landing_pricing_subtitle')}</p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 12 : 24,
        }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              background: plan.popular ? 'rgba(139,92,246,0.08)' : '#0f0f18',
              border: `1px solid ${plan.popular ? 'rgba(139,92,246,0.4)' : '#1a1a2e'}`,
              borderRadius: 20, padding: isMobile ? '24px 20px' : '32px 28px',
              position: 'relative',
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff',
                  fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 100,
                  letterSpacing: '0.5px', whiteSpace: 'nowrap',
                }}>{t('landing_pkg_popular').toUpperCase()}</div>
              )}
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: isMobile ? 36 : 42, fontWeight: 900, margin: '0 0 4px' }}>₺{plan.price}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>{plan.credits}</div>
              <Link href="/register" style={{
                display: 'block', textAlign: 'center', textDecoration: 'none',
                background: plan.popular ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.06)',
                border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px', borderRadius: 10,
                marginBottom: 24, boxShadow: plan.popular ? '0 4px 20px rgba(139,92,246,0.3)' : 'none',
                minHeight: 44, boxSizing: 'border-box' as const, lineHeight: '20px',
              }}>
                {t('landing_buy')}
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9ca3af' }}>
                    <span style={{ color: '#7c3aed', fontSize: 16 }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ maxWidth: 700, margin: '0 auto', padding: isMobile ? '56px 16px' : '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 56 }}>
          <h2 style={{ fontSize: isMobile ? 28 : 60, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>{t('landing_faq_title')}</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ background: '#0f0f18', border: '1px solid #1a1a2e', borderRadius: 14, overflow: 'hidden' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', padding: isMobile ? '14px 16px' : '18px 24px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'transparent', border: 'none', color: '#fff',
                  fontSize: isMobile ? 14 : 15, fontWeight: 600, cursor: 'pointer',
                  textAlign: 'left', gap: 12, minHeight: 44,
                }}
              >
                {faq.q}
                <span style={{
                  color: '#7c3aed', fontSize: 20, flexShrink: 0,
                  transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none',
                }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: isMobile ? '0 16px 14px' : '0 24px 18px', color: '#9ca3af', fontSize: 14, lineHeight: 1.7 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: isMobile ? '24px 16px' : '32px 40px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center',
        position: 'relative', zIndex: 1, gap: isMobile ? 12 : 16,
      }}>
        <Logo size="sm" />
        <div style={{ color: '#4b5563', fontSize: 13 }}>{t('landing_footer_rights')}</div>
        <div style={{ display: 'flex', gap: isMobile ? 16 : 24, flexWrap: 'wrap' }}>
          {[
            [t('landing_privacy'), '/gizlilik'],
            [t('landing_kvkk'), '/kvkk'],
            [t('landing_contact'), '/iletisim'],
          ].map(([label, href]) => (
            <Link key={label} href={href} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
