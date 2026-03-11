import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları — Chekkify',
  description: 'Chekkify kullanım koşulları: Hizmet tanımı, kredi sistemi, plan ve abonelik, yasaklanan kullanımlar.',
};

const sections = [
  {
    title: '1. Hizmet Tanımı',
    text: 'Chekkify, Shopify mağaza sahiplerine yönelik kapıda ödeme (COD) sipariş doğrulama hizmeti sunan bir SaaS platformudur. Platform; SMS ve WhatsApp doğrulama, OTP kodu güvenliği, RTO analizi, kara liste yönetimi ve Shopify entegrasyonu özelliklerini kapsar. Hizmet "olduğu gibi" sunulmakta olup Chekkify, hizmet kesintilerinde sorumluluğunu sürekli erişilebilirlik garantisi vermeksizin karşılamaya çalışır.',
  },
  {
    title: '2. Kredi Sistemi Kuralları',
    text: 'Chekkify, SMS ve WhatsApp gönderimi için kredi bazlı bir faturalandırma modeli kullanır. Her başarılı SMS gönderimi 1 SMS kredisi, her başarılı WhatsApp mesajı 1 WhatsApp kredisi tüketir. Satın alınan krediler iade edilemez. Kullanılmayan kredilerin son kullanma tarihi yoktur, hesap aktif olduğu sürece geçerliliğini korur. Hesap silindiğinde kalan krediler otomatik olarak iptal edilir ve geri ödeme yapılmaz.',
  },
  {
    title: '3. Plan ve Abonelik Koşulları',
    text: 'Chekkify dört plan sunar: Ücretsiz, Starter, Pro ve Business. Plan yükseltmesi anında aktif olur; plan düşürme mevcut abonelik dönemi sonunda geçerli olur. Yıllık planlar aylık plana kıyasla indirimli fiyatlandırılır. Plan kapsamındaki özellikler değiştirilmesi durumunda kullanıcılara makul önceden bildirim yapılır. Chekkify, gelecekte ücretli planlara ek özellik ekleme veya fiyatlandırma değişikliği yapma hakkını saklı tutar.',
  },
  {
    title: '4. Hesap Sorumlulukları',
    text: 'Kullanıcı, hesap güvenliğinden bizzat sorumludur. Şifrenin gizli tutulması, 2FA aktivasyonu ve yetkisiz erişim durumlarının support@chekkify.com adresine derhal bildirilmesi kullanıcının sorumluluğundadır. Tek bir gerçek kişi veya tüzel kişiliğe ait birden fazla hesap açmak yasaktır. Hesabınızın güvenliği ihlal edildiğinde Chekkify, önceden bildirim yapmaksızın hesabı geçici olarak askıya alabilir.',
  },
  {
    title: '5. Yasaklanan Kullanımlar',
    text: 'Platformu şu amaçlarla kullanmak kesinlikle yasaktır: İzinsiz toplu SMS veya WhatsApp gönderimi (spam), başkalarına ait kişisel verilerin rıza alınmaksızın işlenmesi, Chekkify API veya altyapısına yönelik saldırı, DDoS veya brute-force girişimleri, sahte sipariş oluşturma veya sistem manipülasyonu, rakip ürün veya hizmetler için veri toplama, platform üzerinden yasadışı faaliyetlerin yürütülmesi. Bu koşulların ihlali hesabın gecikmeksizin kapatılmasına neden olabilir.',
  },
  {
    title: '6. Shopify Entegrasyonu ve Webhook',
    text: 'Chekkify, Shopify\'ın Partner Program ve API kullanım koşullarına uygun şekilde entegrasyon sağlar. Kullanıcı, mağaza webhook\'larını doğru yapılandırmakla yükümlüdür. Shopify API değişikliklerinden kaynaklanan entegrasyon aksaklıklarında Chekkify, makul sürede uyum güncellemesi yapmaya çalışır; ancak bu süre zarfında oluşabilecek kayıplardan sorumlu tutulamaz.',
  },
  {
    title: '7. Fikri Mülkiyet',
    text: 'Chekkify platformu, kodu, tasarımı, logolar ve ticari markalar dahil tüm içerik Chekkify\'a aittir. Kullanıcılar platforma yükledikleri içerikler (SMS şablonları, mağaza bilgileri) için lisans hakkı vermiş olur. Bu lisans yalnızca hizmetin sunulması amacıyla kullanılır; üçüncü taraflara devredilmez.',
  },
  {
    title: '8. Hesap Kapatma',
    text: 'Kullanıcı dilediği zaman Dashboard → Profil → Hesabı Sil adımlarıyla hesabını kalıcı olarak kapatabilir. Hesap kapatma işlemi geri alınamaz; tüm veriler, mağazalar, siparişler ve kalan krediler kalıcı olarak silinir. Chekkify, bu Kullanım Koşullarının ihlali halinde herhangi bir kullanıcı hesabını önceden bildirim yaparak veya acil durumlarda bildirimsiz kapatma hakkını saklı tutar.',
  },
  {
    title: '9. Sorumluluk Sınırlaması',
    text: 'Chekkify, doğrudan kontrol edemediği üçüncü taraf hizmetlerinden (Twilio, Railway, Shopify API vb.) kaynaklanan aksaklıklar nedeniyle oluşan gelir kayıpları, veri kayıpları veya dolaylı zararlardan sorumlu değildir. Chekkify\'ın herhangi bir olaydaki maksimum sorumluluğu, son 3 aylık abonelik ücretlerini aşamaz.',
  },
  {
    title: '10. Uygulanacak Hukuk',
    text: 'Bu Kullanım Koşulları Türk hukukuna tabidir. Uyuşmazlıklarda İstanbul mahkemeleri ve icra daireleri yetkilidir. Bu koşullar, platformun kullanılmasıyla birlikte kabul edilmiş sayılır. Son güncelleme: Mart 2026.',
  },
];

export default function TermsPage() {
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
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Kullanım Koşulları</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Chekkify hizmetini kullanmaya devam ederek bu koşulları kabul etmiş sayılırsınız — Son güncelleme: Mart 2026</p>
        </div>

        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 40 }}>
          <p style={{ color: '#c4b5fd', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Bu koşullar, Chekkify (chekkify.com) ile siz (kullanıcı) arasındaki hizmet ilişkisini düzenler. Platforma kayıt olarak veya hizmeti kullanarak bu koşulları kabul etmiş sayılırsınız.
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
            Kullanım koşullarına ilişkin sorularınız için:{' '}
            <a href="mailto:support@chekkify.com" style={{ color: '#a855f7', textDecoration: 'none' }}>support@chekkify.com</a>
          </p>
        </div>

        <div style={{ marginTop: 24, padding: '20px 24px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 14 }}>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            İlgili sayfalar:{' '}
            <Link href="/kvkk" style={{ color: '#a855f7', textDecoration: 'none', marginRight: 16 }}>KVKK Aydınlatma Metni</Link>
            <Link href="/privacy" style={{ color: '#a855f7', textDecoration: 'none' }}>Gizlilik Politikası</Link>
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
