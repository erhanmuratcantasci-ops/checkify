/**
 * Schema.org JSON-LD blocks for the landing page. Rendered as a non-React
 * <script type="application/ld+json"> so it ships in the static HTML and
 * Google can ingest it without running JS.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chekkify.com";

const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Chekkify",
  url: SITE_URL,
  logo: `${SITE_URL}/opengraph-image`,
  description:
    "Türkiye'nin Apple-pro Shopify kapıda ödeme doğrulama platformu.",
  areaServed: { "@type": "Country", name: "Türkiye" },
};

const SOFTWARE_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Chekkify",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Shopify",
  description:
    "Otomatik SMS doğrulamayla iptal oranını düşüren Shopify COD asistanı.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "TRY",
    lowPrice: "0",
    highPrice: "499",
    offerCount: "4",
  },
};

export function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_APP) }}
      />
    </>
  );
}
