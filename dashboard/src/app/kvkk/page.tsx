'use client';

import Link from 'next/link';
import GeometricBackground from '@/components/GeometricBackground';
import Logo from '@/components/Logo';

const sections = [
  {
    title: '1. Veri Sorumlusunun Kimliği',
    text: '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla Chekkify, kullanıcılarına ait kişisel verileri işlemektedir. Veri sorumlusuna destek@checkkify.com adresi üzerinden ulaşılabilir.',
  },
  {
    title: '2. İşlenen Kişisel Veriler',
    text: 'Platformumuz kapsamında; ad-soyad, e-posta adresi, telefon numarası, şirket/mağaza bilgileri, IP adresi ve oturum bilgileri, ödeme ve fatura bilgileri ile platform kullanım verileri işlenmektedir.',
  },
  {
    title: '3. Kişisel Verilerin İşlenme Amaçları',
    text: 'Kişisel verileriniz; üyelik ve hesap yönetimi, hizmetlerin sunulması ve geliştirilmesi, SMS doğrulama hizmetinin gerçekleştirilmesi, müşteri destek hizmetlerinin sağlanması, yasal yükümlülüklerin yerine getirilmesi ve istatistiksel analizler yapılması amacıyla işlenmektedir.',
  },
  {
    title: '4. Kişisel Verilerin Aktarıldığı Taraflar',
    text: 'Kişisel verileriniz; SMS hizmet sağlayıcıları, ödeme altyapısı firmaları ve yasal zorunluluklar çerçevesinde yetkili kamu kurum ve kuruluşlarıyla KVKK\'nın 8. ve 9. maddeleri kapsamında paylaşılabilmektedir.',
  },
  {
    title: '5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi',
    text: 'Kişisel verileriniz; platform üzerinden elektronik ortamda, otomatik ve otomatik olmayan yollarla toplanmaktadır. İşlemenin hukuki sebepleri: sözleşmenin ifası, meşru menfaat, açık rıza ve yasal yükümlülüklerdir.',
  },
  {
    title: '6. KVKK Kapsamındaki Haklarınız',
    text: 'KVKK\'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, bu işlemlerin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.',
  },
  {
    title: '7. Başvuru Yöntemi',
    text: 'Yukarıda belirtilen haklarınızı kullanmak için destek@checkkify.com adresine kimliğinizi doğrulayan belgelerle birlikte yazılı başvuruda bulunabilirsiniz. Başvurularınız en geç 30 gün içinde sonuçlandırılacaktır.',
  },
];

export default function KVKKPage() {
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
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px' }}>KVKK Aydınlatma Metni</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında — Son güncelleme: Mart 2026</p>
        </div>

        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 40 }}>
          <p style={{ color: '#c4b5fd', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi gereğince kişisel verilerinizin işlenmesine ilişkin bilgi vermek amacıyla hazırlanmıştır.
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
            KVKK başvurularınız için:{' '}
            <a href="mailto:destek@checkkify.com" style={{ color: '#a855f7', textDecoration: 'none' }}>destek@checkkify.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}
