export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  content: string;
}

export const posts: BlogPost[] = [
  {
    slug: 'shopify-kapida-odeme-dogrulama',
    title: "Shopify'da Kapıda Ödeme Doğrulama Neden Önemli?",
    date: '2026-02-15',
    readTime: '5 dk okuma',
    excerpt: 'Kapıda ödeme siparişleri Türkiye e-ticaret ekosisteminde büyük bir pay tutuyor. Ancak bu kolaylık beraberinde ciddi sorunlar da getiriyor. Sahte siparişler, yüksek iade oranları ve lojistik maliyetler...',
    content: `## Türkiye'de Kapıda Ödeme Gerçeği

Türkiye'de e-ticaret siparişlerinin önemli bir kısmı hâlâ kapıda ödeme yöntemiyle gerçekleşiyor. Bu ödeme yöntemi tüketiciler için güven sağlasa da satıcılar açısından ciddi riskler barındırıyor.

## Sahte Siparişlerin Maliyeti

Her sahte sipariş başına ortalama şu maliyetler oluşuyor:

- **Kargo ücreti:** Gönderi + iade kargo bedeli
- **Depo operasyonu:** Paketleme ve iade işleme
- **Personel zamanı:** İade yönetimi
- **Ürün hasarı:** İade edilen ürünlerdeki değer kayıpları

Bunlar toplandığında, iade edilen her sipariş başına ortalama 80-150 TL zarar oluşabilir. Yüksek hacimli bir mağaza için bu rakam aylık onlarca bin TL'ye ulaşabilir.

## SMS Doğrulamanın Gücü

Sipariş onayı için SMS doğrulama sistemleri bu sorunu köklü çözüyor. İşte nasıl çalıştığı:

1. Müşteri kapıda ödeme seçerek sipariş verir
2. Sistem otomatik olarak müşteriye SMS gönderir
3. Müşteri mesajı onaylar veya reddeder
4. Yalnızca onaylanan siparişler kargoya verilir

Bu basit adım, sahte sipariş oranını %40'a kadar düşürebilir.

## Chekkify'ın Yaklaşımı

Chekkify, Shopify webhook sistemi ile entegre çalışarak her yeni kapıda ödeme siparişini otomatik olarak işleme alır. Kurulum 5 dakikadan fazla sürmez ve teknik bilgi gerektirmez.

Gerçek veriler, Chekkify kullanan mağazaların:
- İlk ay içinde iade oranlarını %35 düşürdüğünü
- Kargo maliyetlerinde aylık ortalama %28 tasarruf ettiğini
- Müşteri memnuniyetini artırdığını gösteriyor.

## Sonuç

Kapıda ödeme doğrulama artık bir lüks değil, rekabetçi e-ticaret ortamında hayatta kalmanın zorunlu bir parçası. Küçük bir otomasyonla büyük maliyetleri önlemek mümkün.`,
  },
  {
    slug: 'iade-oranini-dusurme',
    title: 'COD Siparişlerinde İade Oranını Düşürmenin 5 Yolu',
    date: '2026-02-28',
    readTime: '7 dk okuma',
    excerpt: 'Kapıda ödeme siparişlerinde iade oranını düşürmek için uygulayabileceğiniz 5 pratik strateji. Bu yöntemler hem müşteri memnuniyetini artırır hem de operasyonel maliyetlerinizi önemli ölçüde azaltır.',
    content: `## İade Sorunu Neden Bu Kadar Büyük?

Türk e-ticaret sektöründe kapıda ödeme siparişlerinde iade oranı, kredi kartlı ödemelere kıyasla 3-4 kat daha yüksek. Bunun temel nedenleri arasında düşünülmeden verilen siparişler, yanlış boyut/renk seçimleri ve sahte siparişler yer alıyor.

## 1. SMS Doğrulama Sistemi Kullanın

En etkili yöntem, sipariş alındıktan sonra müşteriyi SMS ile doğrulamak. Sadece bu adım, iade oranını %30-40 oranında düşürebilir.

**Nasıl çalışır?**
- Sipariş alınır
- Müşteriye "Siparişinizi onaylıyor musunuz?" SMS'i gönderilir
- Müşteri onay vermezse sipariş iptal edilir
- Kargo yalnızca onaylanan siparişler için hazırlanır

## 2. Ürün Sayfasını İyileştirin

Müşteriler çoğu zaman ürünü tam olarak anlamadan sipariş veriyor. Şunları ekleyin:

- **Boyut tablosu:** Özellikle giyim kategorisinde kritik
- **Yüksek çözünürlüklü fotoğraflar:** Farklı açılardan en az 5 fotoğraf
- **Ölçü bilgileri:** Kesin sayısal değerler
- **Müşteri yorumları:** Gerçek kullanıcı geri bildirimleri

## 3. Doğru Müşteri Segmentasyonu

Tüm müşteriler aynı iade riskini taşımaz. Bazı sinyaller yüksek riskli sipariş göstergesidir:

- Aynı müşteriden kısa sürede çok sayıda sipariş
- Daha önce iade geçmişi olan müşteriler
- Geceleri verilen siparişler

Bu müşteriler için ek doğrulama adımları eklemek iade oranını düşürür.

## 4. SMS Gönderim Zamanlamasını Optimize Edin

Sabah 9'dan akşam 9'a kadar SMS göndermek, gece yarısı göndermekten çok daha yüksek onay oranı sağlar.

Chekkify, mağaza bazında SMS gönderim saatlerini özelleştirmenize olanak tanır.

## 5. Kargo Takip Bildirimleri Ekleyin

Müşteriyi süreç boyunca bilgilendirmek, teslimat anındaki şaşkınlık kaynaklı iadeleri azaltır. Gönderi hazırlandığında ve kargoya verildiğinde otomatik SMS veya e-posta bildirimi gönderin.

## Özet

Bu 5 yöntemin birlikte uygulanması, iade oranınızı %50'ye kadar düşürebilir. Başlangıç noktası olarak SMS doğrulama en hızlı ve ölçülebilir sonucu verecektir.`,
  },
  {
    slug: 'chekkify-entegrasyon-rehberi',
    title: 'Chekkify ile Mağazanızı Nasıl Entegre Edersiniz?',
    date: '2026-03-05',
    readTime: '4 dk okuma',
    excerpt: 'Chekkify entegrasyonu için adım adım rehber. Shopify webhook kurulumundan SMS şablonu özelleştirmeye kadar tüm süreç, teknik bilgi gerektirmeden 5 dakikada tamamlanıyor.',
    content: `## Entegrasyon Süreci Hakkında

Chekkify, Shopify webhook sistemi üzerine inşa edilmiş bir doğrulama platformudur. Entegrasyon son derece basit olup teknik bilgi gerektirmez. Ortalama kurulum süresi 5 dakikadır.

## Adım 1: Hesap Oluşturun

[chekkify.com](https://chekkify.com) adresini ziyaret edin ve "Ücretsiz Başla" butonuna tıklayın. Email ve şifrenizle ücretsiz hesabınızı oluşturun.

## Adım 2: Mağaza Ekleyin

Dashboard'a giriş yaptıktan sonra "Mağazalar" menüsüne gidin ve "+ Yeni Mağaza" butonuna tıklayın.

- **Mağaza Adı:** Mağazanızın adını girin (örn. "Modamın Mağazası")
- **Shopify Domain:** myshopify.com adresinizi girin (opsiyonel)

Mağaza oluşturulunca size özel bir **Webhook Secret** atanır.

## Adım 3: Shopify'da Webhook Kurun

1. Shopify yönetim panelinizi açın
2. **Ayarlar → Bildirimler** sayfasına gidin
3. Sayfanın en altında **Webhook'lar** bölümünü bulun
4. **"Webhook oluştur"** butonuna tıklayın
5. Aşağıdaki ayarları girin:
   - **Olay:** Sipariş oluşturuldu
   - **Format:** JSON
   - **URL:** \`https://api.chekkify.com/webhook/orders/create\`
6. Chekkify'dan kopyaladığınız **Webhook Secret**'ı "İmzalama anahtarı" alanına yapıştırın
7. Kaydedin

## Adım 4: SMS Şablonunu Özelleştirin

Chekkify, müşterilerinize gönderilecek SMS metnini özelleştirmenize imkân tanır. Kullanabileceğiniz değişkenler:

- **{isim}** — Müşterinin adı
- **{siparis_no}** — Sipariş numarası
- **{link}** — Onay linki
- **{tutar}** — Sipariş tutarı

Örnek şablon:
\`Merhaba {isim}, {siparis_no} numaralı siparişinizi onaylamak için: {link}\`

## Adım 5: Test Edin

Shopify mağazanızdan bir test siparişi verin (kapıda ödeme seçeneğini kullanın). Birkaç saniye içinde telefon numarasına SMS gelmeli.

## SMS Kredileri

Her başarılı SMS gönderimi 1 kredi tüketir. Yeni hesaplara başlangıç kredisi tanınır. Daha fazla kredi için Credits sayfasından paket satın alabilirsiniz.

## Sorun Giderme

Eğer SMS gelmiyorsa kontrol edin:
- Webhook URL'nin doğru girildiğini
- Secret'ın tam olarak kopyalandığını
- Siparişin "kapıda ödeme" ile verildiğini
- SMS kredisi bakiyenizin yeterli olduğunu

Destek için: destek@chekkify.com`,
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find(p => p.slug === slug);
}
