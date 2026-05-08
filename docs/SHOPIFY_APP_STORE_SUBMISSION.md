# Shopify App Store başvuru rehberi — Chekkify

Bu doküman M5 sprint'inden sonra **Erhan'ın elle yapması gereken**
Shopify Partners panel + App Store başvuru adımlarını sıralar. Kod
tarafı M5 sonu itibariyle hazır; bu rehber kalan operasyonel + içerik
işlerini liste halinde gösterir.

> **Önemli:** App Store review süresi 3–4 hafta. Tüm bu adımlar
> tamamlanmadan başvuru reddedilir veya askıya alınır.

---

## 1. Partners panel — App config

[partners.shopify.com](https://partners.shopify.com) → **Apps** → Chekkify (yoksa
"Create app" → "Custom app" → daha sonra "Distribution" → "Public app").

### 1.1 App URL ve redirect URL'leri

| Alan | Değer |
|---|---|
| App URL | `https://chekkify.com/embedded` |
| Allowed redirection URL(s) | `https://api.chekkify.com/shopify/callback` |
| Embedded in Shopify admin | **Evet** (Built for Shopify zorunlu) |
| Event subscription API version | `2025-07` |

### 1.2 Webhook subscription'ları

Partners panel → **Webhooks** → her satırı tek tek ekle. HMAC kontrolü
backend tarafında zaten yapılıyor; Partners sadece URL'i bilmek istiyor.

| Topic | Endpoint | Sprint |
|---|---|---|
| `orders/create` | `https://api.chekkify.com/webhook/orders/create` | M5 öncesi var |
| `app/uninstalled` | `https://api.chekkify.com/webhook/app/uninstalled` | M5 öncesi var |
| `customers/data_request` | `https://api.chekkify.com/webhook/gdpr/customers/data_request` | **M5 backend mini-PR** ✅ |
| `customers/redact` | `https://api.chekkify.com/webhook/gdpr/customers/redact` | **M5 backend mini-PR** ✅ |
| `shop/redact` | `https://api.chekkify.com/webhook/gdpr/shop/redact` | **M5 backend mini-PR** ✅ |

Test:

```bash
# Her bir GDPR webhook'u Partners panel "Send test notification"
# butonuyla tetikle; response 200 ve <5s olmalı.
curl -i https://api.chekkify.com/webhook/gdpr/customers/data_request \
  -H "X-Shopify-Hmac-Sha256: <test>" \
  -H "Content-Type: application/json" \
  --data-raw '{"shop_domain":"...","customer":{}}'
```

### 1.3 Required scopes

OAuth scope listesi `backend/src/routes/shopify.ts`'de tanımlı:

```
read_orders
write_orders
read_fulfillments
write_fulfillments
```

Partners panel **App configuration → Access scopes** ile aynı listeyi
gir. Ek scope eklemeden önce minimum-scope policy'yi düşün — BfS
review fazla scope'u sorgular.

### 1.4 GDPR webhook URL'leri

Yukarıda webhook tablosunda zaten var; Partners panel **App setup →
GDPR webhooks** sekmesinde de aynı 3 URL ayrıca girilir (bazı
hesaplarda Webhooks sekmesinden ayrılır):

```
Customer data request:  https://api.chekkify.com/webhook/gdpr/customers/data_request
Customer redact:        https://api.chekkify.com/webhook/gdpr/customers/redact
Shop redact:            https://api.chekkify.com/webhook/gdpr/shop/redact
```

---

## 2. Vercel + Railway env'leri

### Vercel (frontend)

| Variable | Değer |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.chekkify.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://chekkify.com` |
| `NEXT_PUBLIC_SHOPIFY_API_KEY` | Partners panel App credentials → "API key" (Client ID) |

`NEXT_PUBLIC_SHOPIFY_API_KEY` değeri **public** (OAuth URL'inde zaten
görünüyor), Vercel'e koymak güvenli. Embedded layout `<meta>`
tag'inden okur.

### Railway (backend)

| Variable | Değer |
|---|---|
| `SHOPIFY_API_KEY` | Partners panel API key (frontend'le aynı) |
| `SHOPIFY_API_SECRET` | Partners panel API secret (asla public yapma) |
| `BASE_URL` | `https://api.chekkify.com` |
| `DASHBOARD_URL` | `https://chekkify.com` |

---

## 3. App Store listing materyalleri

Partners panel → **App listing** → "Edit listing".

### 3.1 App icon
- 1200×1200 PNG (Shopify retina için ek 2400×2400 önerir)
- Şeffaf arka plan değil — solid background
- Hot Coral (`#FB7185`) veya pure black üstüne wordmark öneririm

### 3.2 Screenshots
Min 5, max 8. **1600×900 PNG**. Önerilen sıralama:

1. `/embedded` mini dashboard (Polaris kartlar + recent orders)
2. `/dashboard` Apple-pro overview (4 metric + son siparişler tablosu)
3. `/orders/[id]` order detay sayfası
4. `/blocking-rules` Stats tab (Recharts coral)
5. `/confirm/[token]` müşteri onay success state (mobil kayıtlı)

### 3.3 Demo video (önerilir, zorunlu değil)
- 30–90 saniye
- Format: MP4 H.264, max 100MB
- İçerik: SMS gelir → müşteri linke tıklar → onay → merchant dashboard'da
  gözükür. 90 saniyede tüm flow gösterilebilir.

### 3.4 App description

**App store name:** Chekkify

**Tagline (≤80 char):** Kapıda ödeme siparişlerini SMS ile otomatik
doğrula. İptal oranını düşür.

**Detailed description (Türkçe + İngilizce):**

> **Türkçe**
>
> Chekkify, Türkiye'deki Shopify mağazaları için tasarlanan bir
> kapıda ödeme (COD) doğrulama aracıdır. Her sipariş için müşteriye
> otomatik SMS ya da WhatsApp gönderilir; müşteri linke tıklayarak
> veya 6 haneli OTP'yi girerek siparişini onaylar. Onaylanmayan
> siparişler kargoya çıkmadan elenir, RTO maliyetin düşer.
>
> **Özellikler:**
> - SMS + WhatsApp doğrulama (Pro plan)
> - 6 haneli OTP fallback
> - IP, telefon deseni, posta kodu engelleme kuralları
> - 30 günlük telefon ve IP başına sipariş limiti
> - Detaylı SMS log + RTO analizi
> - Çoklu mağaza yönetimi
> - Apple-pro arayüz, Türkçe destek
>
> **Built for:** Türkiye'deki COD ile satış yapan Shopify mağazaları.
>
> **English**
>
> Chekkify is a Cash-on-Delivery (COD) verification app for Shopify
> stores in Türkiye. Every order automatically sends an SMS or
> WhatsApp message to the customer; customers confirm via link or
> 6-digit OTP. Unconfirmed orders are filtered before shipping,
> reducing RTO cost.

**Pricing card listing:**

| Plan | Aylık | Yıllık | İçerik |
|---|---|---|---|
| Free | ₺ 0 | ₺ 0 | 1 mağaza, 50 SMS |
| Starter | ₺ 99 | ₺ 79 | 3 mağaza, 300 SMS, OTP, PDF fatura |
| Pro | ₺ 249 | ₺ 199 | 10 mağaza, 1.000 SMS, WhatsApp, RTO analizi, blocklist |
| Business | ₺ 499 | ₺ 399 | Sınırsız mağaza, 3.000 SMS, öncelikli destek |

> Şu an Shopify Billing API'ya bağlı değil — Erhan KYC (iyzico) ve
> kendi billing flow'umuzla yönetiyor. App Store sayfasında "external
> billing" olarak işaretle. BfS review bunu kabul ediyor; Shopify
> Managed Pricing'e geçiş ayrı bir sprint.

### 3.5 Support / Privacy

| Alan | Değer |
|---|---|
| Support email | `destek@chekkify.com` (oluşturulacak) |
| Support URL | `https://chekkify.com/iletisim` |
| Privacy policy URL | `https://chekkify.com/gizlilik` (TR) — `/privacy` (EN) |
| Pricing details URL | `https://chekkify.com/pricing` |

---

## 4. Built for Shopify checklist final durumu

### 🟢 Hazır

- [x] App URL HTTPS
- [x] Embedded app (Polaris + App Bridge wired)
- [x] Session token authentication (M5 backend mini-PR — middleware ready, route'lara bağlanması beklenecek)
- [x] HMAC validation on all webhooks
- [x] GDPR mandatory webhooks (3 endpoint)
- [x] CSP `frame-ancestors https://*.myshopify.com https://admin.shopify.com`
- [x] Polaris UI for embedded surface
- [x] tr-TR locale (Polaris built-in)
- [x] Force dark color-scheme via override CSS
- [x] Webhook responses < 5s (200 returned before async work)
- [x] OAuth scopes minimal (4 scopes, only orders + fulfillments)
- [x] API version current (2025-07)

### 🟡 Şartlı / kontrol edilecek

- [ ] **Test mağazasında install + iframe test** — Erhan kontrol edecek (extra-C)
- [ ] **Performance: TTI < 3s embedded ortamda** — Vercel preview deploy + Lighthouse mobile audit
- [ ] **Mobile responsive Shopify mobile admin'de** — Erhan iPhone Shopify app içinden test
- [ ] **Accessibility: WCAG AA** — Polaris primitive'leri otomatik sağlar; custom override CSS focus ring uyumlu

### 🔴 Erhan tarafında bekleyen

- [ ] App icon (1200×1200 PNG)
- [ ] 5 App Store screenshot
- [ ] Demo video (opsiyonel, kesinlikle önerilir)
- [ ] App description (TR + EN) — yukarıda taslak verildi, Erhan finalize eder
- [ ] support@chekkify.com email kurulumu
- [ ] Partners panel webhook URL'leri girilmesi (yukarıdaki tablo)
- [ ] Privacy policy + Kullanım koşulları sayfaları Shopify-spesifik içerikle güncellenmesi (legal hardening sprint)

---

## 5. M5 sonrası teknik bekleme listesi

Bu maddeler App Store başvurusu için bloker **değil** ama lansman
sonrası 1–2 sprint içinde halledilmeli:

- **Backend `/shopify-session/*` route'ları:** Embedded sayfalar şu
  an mock data ile çalışıyor. Bu route'lar `shopifySessionToken`
  middleware'iyle session-token verify edip embedded merchant'a özel
  veri döndürür (`/shopify-session/embedded/summary`,
  `/shopify-session/embedded/orders/recent`, vb).
- **Shop.accessToken encryption:** Şu an plain text. Lansmandan önce
  AES-GCM ile şifreleme + decryption helper.
- **Shopify Managed Pricing migration:** External billing hâlâ
  destekleniyor ama BfS bonus puan veriyor. iyzico KYC tamamlandıktan
  sonra düşünülmeli.
- **GDPR `customers/data_request`** şu an log + manuel email; gerçek
  veri export'u queue worker'a taşınmalı (legal hardening sprint).

---

## 6. Başvuru flow'u (sırayla)

1. Tüm 🔴 maddeleri tamamla (icon, screenshot, video, description)
2. Vercel + Railway env'lerini gir (özellikle
   `NEXT_PUBLIC_SHOPIFY_API_KEY`)
3. Partners panel webhook URL'lerini ekle ve hepsine "Send test
   notification" yap; response 200 + <5s olmalı
4. Test mağazasında embedded app'i install et
   (`https://chekkify.com/embedded` Shopify Admin iframe'inde
   açılmalı)
5. Embedded mini dashboard + onboarding flow'u tarayıcıdan ve
   Shopify mobile app'tan test et
6. Lighthouse mobile audit Vercel preview URL'inde 90+ olmalı
7. App listing'i finalize et, "Submit for review" bas
8. Review süresi: ~3-4 hafta. Geri bildirim email ile gelir,
   Partners panel "App review" sekmesinde takip edilir

---

## 7. Hızlı troubleshooting

| Sorun | Sebep | Çözüm |
|---|---|---|
| Embedded blank page | CSP frame-ancestors yanlış | `dashboard/src/proxy.ts`'i kontrol et, `/embedded` matcher'da |
| "Invalid session token" 401 | API key/secret env yanlış | Vercel `NEXT_PUBLIC_SHOPIFY_API_KEY` ile Railway `SHOPIFY_API_KEY` aynı olmalı |
| Polaris styles light gözüküyor | Override CSS yüklenmedi | `embedded/layout.tsx` import sırası: Polaris CSS önce, override sonra |
| GDPR webhook test 401 | HMAC header yanlış | Partners panel "Send test notification" doğru HMAC üretir; Postman ile manuel HMAC üretmek istersen `SHOPIFY_API_SECRET` + raw body |
| Webhook 200 ama 5s aşıyor | Sync work çok yavaş | `gdpr.ts` zaten async pattern kullanıyor; yeni endpoint eklerken aynı pattern'i koru |

---

**Son güncelleme:** M5 sprint sonu (feat/apple-ui-m5-embedded).
**Sıradaki:** Erhan başvuru materyallerini hazırlayıp Vercel + Railway
env'lerini girer; Partners panel webhook URL'lerini ekler; test mağaza
flow'unu doğrular; Submit for review.
