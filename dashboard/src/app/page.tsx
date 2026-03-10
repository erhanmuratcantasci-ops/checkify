'use client';

import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';
import { useState } from 'react';

const faqs = [
  { q: 'Chekkify nasıl çalışır?', a: 'Shopify mağazanıza webhook bağlantısı kurarsınız. Yeni kapıda ödeme siparişi geldiğinde müşterinize otomatik SMS gönderilir. Müşteri onaylarsa sipariş işleme alınır, reddederse iptal edilir.' },
  { q: 'Hangi kargo firmalarıyla uyumlu?', a: 'Chekkify kargo firmasından bağımsız çalışır. Shopify üzerindeki tüm siparişler için çalışır.' },
  { q: 'SMS gönderimi nasıl faturalanır?', a: 'Kredi bazlı sistem kullanıyoruz. Paket satın alırsınız, her SMS gönderiminde kredi düşer. Abonelik yoktur.' },
  { q: 'Entegrasyon ne kadar sürer?', a: 'Shopify webhook kurulumu 5 dakika içinde tamamlanır. Teknik bilgi gerekmez.' },
];

const steps = [
  { num: '01', title: 'Mağazanı bağla', desc: 'Shopify mağazanı Chekkify\'a bağla. Webhook kurulumu tek tık.' },
  { num: '02', title: 'Sipariş gelir', desc: 'Kapıda ödeme siparişi alındığında Chekkify otomatik devreye girer.' },
  { num: '03', title: 'SMS doğrulama', desc: 'Müşteriye SMS gönderilir. Onay verir ya da iptal eder.' },
];

const plans = [
  { name: 'Başlangıç', credits: '100 SMS', price: '49', desc: 'Küçük mağazalar için ideal', features: ['100 doğrulama SMS\'i', 'Shopify entegrasyonu', 'Temel dashboard', 'E-posta destek'] },
  { name: 'Büyüme', credits: '500 SMS', price: '199', desc: 'Büyüyen işletmeler için', features: ['500 doğrulama SMS\'i', 'Shopify entegrasyonu', 'Gelişmiş dashboard', 'Öncelikli destek', 'İptal analitikleri'], popular: true },
  { name: 'Pro', credits: '2000 SMS', price: '599', desc: 'Yüksek hacimli satıcılar için', features: ['2000 doğrulama SMS\'i', 'Shopify entegrasyonu', 'Tam dashboard', '7/24 destek', 'İptal analitikleri', 'API erişimi'] },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", color: '#fff', position: 'relative' }}>
      <GeometricBackground />

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size="sm" />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14, fontWeight: 500 }}>Giriş Yap</Link>
          <Link href="/register" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontSize: 14, fontWeight: 600, padding: '8px 20px', borderRadius: 8, boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}>Ücretsiz Başla</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '120px 24px 100px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 32 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px #a855f7' }} />
          <span style={{ color: '#c4b5fd', fontSize: 13, fontWeight: 500 }}>Türkiye'nin COD doğrulama platformu</span>
        </div>
        <h1 style={{ fontSize: 'clamp(58px, 6vw, 92px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 24px', letterSpacing: '-1px', fontFamily: "'Outfit', sans-serif" }}>
          Sahte Siparişlere<br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Son Ver.</span>
        </h1>
        <p style={{ fontSize: 22, color: '#9ca3af', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 40px', fontWeight: 400 }}>
          Kapıda ödeme siparişlerini SMS ile doğrula. İade oranını düşür, karlılığını artır.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontSize: 16, fontWeight: 700, padding: '14px 32px', borderRadius: 12, boxShadow: '0 8px 30px rgba(139,92,246,0.4)', display: 'inline-block' }}>
            Ücretsiz Başla →
          </Link>
          <Link href="#how" style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 16, fontWeight: 500, padding: '14px 32px', borderRadius: 12, display: 'inline-block' }}>
            Nasıl Çalışır?
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', marginTop: 72, flexWrap: 'wrap' }}>
          {[['%40', 'daha az iade'], ['5 dk', 'kurulum süresi'], ['7/24', 'otomatik çalışır']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, fontWeight: 800, background: 'linear-gradient(135deg, #c4b5fd, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{val}</div>
              <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 60, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Nasıl Çalışır?</h2>
          <p style={{ color: '#6b7280', fontSize: 36 }}>3 adımda kurulum, otomatik çalışır</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ background: '#0f0f18', border: '1px solid #1a1a2e', borderRadius: 20, padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 64, fontWeight: 900, color: 'rgba(139,92,246,0.08)', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{step.num}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>{step.num}</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>{step.title}</h3>
              <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 60, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Fiyatlandırma</h2>
          <p style={{ color: '#6b7280', fontSize: 36 }}>Abonelik yok. Sadece kullandığın kadar öde.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {plans.map((plan, i) => (
            <div key={i} style={{ background: plan.popular ? 'rgba(139,92,246,0.08)' : '#0f0f18', border: `1px solid ${plan.popular ? 'rgba(139,92,246,0.4)' : '#1a1a2e'}`, borderRadius: 20, padding: '32px 28px', position: 'relative' }}>
              {plan.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 100, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>EN POPÜLER</div>}
              <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 42, fontWeight: 900, margin: '0 0 4px' }}>₺{plan.price}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>{plan.credits}</div>
              <Link href="/register" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: plan.popular ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.06)', border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px', borderRadius: 10, marginBottom: 24, boxShadow: plan.popular ? '0 4px 20px rgba(139,92,246,0.3)' : 'none' }}>
                Satın Al
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
      <section id="faq" style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 60, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Sık Sorulan Sorular</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ background: '#0f0f18', border: '1px solid #1a1a2e', borderRadius: 14, overflow: 'hidden' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left', gap: 16 }}>
                {faq.q}
                <span style={{ color: '#7c3aed', fontSize: 20, flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {openFaq === i && <div style={{ padding: '0 24px 18px', color: '#9ca3af', fontSize: 14, lineHeight: 1.7 }}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 16 }}>
        <Logo size="sm" />
        <div style={{ color: '#4b5563', fontSize: 13 }}>© 2026 Chekkify. Tüm hakları saklıdır.</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Gizlilik', '/gizlilik'], ['KVKK', '/kvkk'], ['İletişim', '/iletisim']].map(([label, href]) => (
            <Link key={label} href={href} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
