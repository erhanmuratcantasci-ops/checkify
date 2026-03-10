'use client';

import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';

const sections = [
  {
    title: '1. Toplanan Bilgiler',
    text: 'Checkify olarak hizmetlerimizi sunabilmek amacıyla ad, e-posta adresi, şirket bilgileri ve ödeme bilgileri gibi kişisel verilerinizi toplayabiliriz. Ayrıca platformumuzu kullanırken otomatik olarak IP adresi, tarayıcı türü, işletim sistemi ve kullanım verileri gibi teknik bilgiler de toplanabilir.',
  },
  {
    title: '2. Bilgilerin Kullanım Amacı',
    text: 'Toplanan kişisel veriler; hizmetlerimizin sunulması ve geliştirilmesi, hesap yönetimi ve doğrulama, müşteri destek hizmetleri, yasal yükümlülüklerin yerine getirilmesi ve kullanıcı deneyiminin iyileştirilmesi amacıyla kullanılmaktadır.',
  },
  {
    title: '3. Bilgilerin Paylaşımı',
    text: 'Kişisel verileriniz; yasal zorunluluklar dışında, önceden açık rızanız alınmadan üçüncü taraflarla paylaşılmaz. Hizmet sunumu için gerekli olan üçüncü taraf sağlayıcılar (ödeme işlemcileri, SMS sağlayıcıları vb.) ile yalnızca gerekli minimum düzeyde veri paylaşılır.',
  },
  {
    title: '4. Çerezler',
    text: 'Platformumuz, kullanıcı deneyimini iyileştirmek ve oturum yönetimi sağlamak amacıyla çerezler kullanmaktadır. Tarayıcı ayarlarınız üzerinden çerezleri devre dışı bırakabilirsiniz; ancak bu durumda bazı hizmet özelliklerinden yararlanamayabilirsiniz.',
  },
  {
    title: '5. Veri Güvenliği',
    text: 'Kişisel verilerinizin güvenliğini sağlamak için endüstri standardı şifreleme ve güvenlik protokolleri kullanıyoruz. Verilerinize yetkisiz erişimi, ifşayı veya değiştirilmeyi önlemek amacıyla teknik ve idari tedbirler almaktayız.',
  },
  {
    title: '6. Veri Saklama Süresi',
    text: 'Kişisel verileriniz, hizmet ilişkisinin devam ettiği süre boyunca ve yasal yükümlülükler gerektirdiği ölçüde saklanır. Hesabınızı silmeniz durumunda verileriniz, yasal saklama süreleri saklı kalmak kaydıyla sistemlerimizden silinir.',
  },
  {
    title: '7. Haklarınız',
    text: 'Kişisel verilerinize ilişkin erişim, düzeltme, silme, işlemeyi kısıtlama ve taşınabilirlik haklarına sahipsiniz. Bu haklarınızı kullanmak için destek@checkify.com adresine başvurabilirsiniz.',
  },
  {
    title: '8. Değişiklikler',
    text: 'Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler olması durumunda kayıtlı e-posta adresinize bildirim gönderilecektir. Politikanın güncel versiyonu her zaman bu sayfada yayımlanacaktır.',
  },
];

export default function GizlilikPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Outfit', sans-serif", color: '#fff', position: 'relative' }}>
      <GeometricBackground />

      {/* Header */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
        <Link href="/login" style={{ textDecoration: 'none', color: '#9ca3af', fontSize: 14 }}>Giriş Yap</Link>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 48 }}>
          <Link href="/" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>← Ana Sayfa</Link>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Gizlilik Politikası</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Son güncelleme: Mart 2026</p>
        </div>

        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 40 }}>
          <p style={{ color: '#c4b5fd', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Bu Gizlilik Politikası, Checkify platformunu kullanırken kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.
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
            Sorularınız için:{' '}
            <a href="mailto:destek@checkify.com" style={{ color: '#a855f7', textDecoration: 'none' }}>destek@checkify.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}
