import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası — Chekkify',
  description: 'Chekkify gizlilik politikası: Toplanan veriler, kullanım amacı, üçüncü taraflar ve veri silme talebi.',
};

const sections = [
  {
    title: '1. Toplanan Veriler',
    text: 'Chekkify platformunu kullanırken şu veriler toplanır: (a) Hesap bilgileri: ad-soyad, e-posta adresi, şifreli (hash) parola; (b) Mağaza bilgileri: mağaza adı, Shopify domain, webhook secret; (c) Sipariş verileri: müşteri adı, telefon numarası, sipariş tutarı, sipariş durumu, Shopify sipariş ID; (d) Teknik veriler: IP adresi, tarayıcı bilgisi, oturum token\'ları, erişim zamanları; (e) SMS ve WhatsApp kayıtları: gönderim durumu, hata mesajları.',
  },
  {
    title: '2. Verilerin Kullanım Amacı',
    text: 'Toplanan veriler şu amaçlarla kullanılır: Hesap ve oturum yönetimi, SMS/WhatsApp doğrulama hizmetinin sağlanması, Shopify webhook entegrasyonu, RTO ve iade oranı analizleri, kara liste ve posta kodu filtresi işlemleri, müşteri destek talepleri, sistem güvenliği ve dolandırıcılık önleme, yasal yükümlülüklerin yerine getirilmesi.',
  },
  {
    title: '3. Üçüncü Taraf Hizmet Sağlayıcılar',
    text: 'Chekkify, hizmet sunumunda aşağıdaki üçüncü taraflarla çalışmaktadır: Railway (veritabanı barındırma — PostgreSQL), Vercel (uygulama barındırma ve CDN), Resend (işlemsel e-posta: şifre sıfırlama, bildirimler), Twilio (SMS ve WhatsApp mesaj gönderimi), Crisp (müşteri destek canlı sohbet). Bu sağlayıcılar Chekkify adına veri işler ve kendi gizlilik politikalarına tabidir. Verileriniz bu sağlayıcılar dışında üçüncü kişilerle paylaşılmaz.',
  },
  {
    title: '4. Çerez (Cookie) Politikası',
    text: 'Chekkify yalnızca işlevsel çerezler kullanır: (a) Oturum çerezi (accessToken): JWT tabanlı, 24 saat geçerli, HttpOnly flag ile korunur; (b) Yenileme token çerezi (refreshToken): 7 gün geçerli, güvenli oturum sürekliliği için kullanılır; (c) Dil tercihi (lang): localStorage\'da saklanır, pazarlama amacı taşımaz. Üçüncü taraf reklam veya izleme çerezi kullanılmaz.',
  },
  {
    title: '5. Veri Güvenliği',
    text: 'Verilerinizin güvenliği için uygulanan önlemler: Şifreler bcrypt ile hash\'lenir, düz metin olarak saklanmaz. JWT token\'ları 24 saatlik kısa ömürlü olarak düzenlenir. Tüm bağlantılar HTTPS/TLS ile şifrelenir. Rate limiting ve IP bazlı brute-force koruması uygulanır. Helmet.js ile HTTP güvenlik başlıkları aktiftir. Şüpheli aktiviteler SecurityLog tablosunda kayıt altına alınır.',
  },
  {
    title: '6. Veri Saklama Süreleri',
    text: 'Aktif hesap verileri hesap silinene kadar saklanır. Sipariş kayıtları 5 yıl, SMS/WhatsApp logları 2 yıl, güvenlik logları 1 yıl boyunca tutulur. Hesap silme talebinde tüm kişisel veriler 30 gün içinde kalıcı olarak silinir.',
  },
  {
    title: '7. Veri Silme Talebi',
    text: 'Hesabınızı ve verilerinizi silmek için Dashboard → Profil → Hesabı Sil adımlarını takip edebilirsiniz. Alternatif olarak support@chekkify.com adresine e-posta göndererek silme talebinde bulunabilirsiniz. Talepler en geç 30 gün içinde işleme alınır.',
  },
  {
    title: '8. Çocuklara Yönelik Veri İşleme',
    text: 'Chekkify hizmetleri 18 yaşın altındaki bireylere yönelik değildir. 18 yaş altı kullanıcıların platform üzerinden kayıt olması ve kişisel veri paylaşması uygun değildir.',
  },
  {
    title: '9. Politika Değişiklikleri',
    text: 'Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler e-posta ile bildirilir. Güncel politika her zaman bu sayfada yayımlanır. Son güncelleme: Mart 2026.',
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", color: '#fff', position: 'relative' }}>
      <GeometricBackground />

      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
        <Link href="/login" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14 }}>Giriş Yap</Link>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>← Ana Sayfa</Link>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Gizlilik Politikası</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Verilerinizi nasıl topladığımız ve kullandığımız hakkında — Son güncelleme: Mart 2026</p>
        </div>

        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 40 }}>
          <p style={{ color: '#c4b5fd', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Bu politika, Chekkify (chekkify.com) tarafından toplanan ve işlenen kişisel verilere ilişkin uygulamalarımızı açıklamaktadır.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e5e7eb', margin: '0 0 10px' }}>{s.title}</h2>
              <p style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.8, margin: 0 }}>{s.text}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, padding: '24px', background: '#0f0f18', border: '1px solid #1a1a2e', borderRadius: 14 }}>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
            Gizlilik ile ilgili sorularınız için:{' '}
            <a href="mailto:support@chekkify.com" style={{ color: '#a855f7', textDecoration: 'none' }}>support@chekkify.com</a>
          </p>
        </div>

        <div style={{ marginTop: 24, padding: '20px 24px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 14 }}>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            İlgili sayfalar:{' '}
            <Link href="/kvkk" style={{ color: '#a855f7', textDecoration: 'none', marginRight: 16 }}>KVKK Aydınlatma Metni</Link>
            <Link href="/terms" style={{ color: '#a855f7', textDecoration: 'none' }}>Kullanım Koşulları</Link>
          </p>
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 40px',
        display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 12,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
        <div style={{ color: '#4b5563', fontSize: 13 }}>© 2026 Chekkify. Tüm hakları saklıdır.</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['Blog', '/blog'], ['KVKK', '/kvkk'], ['Gizlilik Politikası', '/privacy'], ['Kullanım Koşulları', '/terms']].map(([l, h]) => (
            <Link key={l} href={h} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
