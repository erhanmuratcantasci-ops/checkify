import { ImageResponse } from "next/og";

// Next 16 file-based OG image: /opengraph-image
// Auto-attached by Next to every <meta property="og:image"> on the site.
export const runtime = "edge";
export const alt = "Chekkify — Kapıda ödeme. Akıllı onay.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(80% 60% at 80% 0%, rgba(251,113,133,0.55) 0%, rgba(251,113,133,0) 60%), #000000",
          color: "#f5f5f7",
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.04em",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#f5f5f7",
            display: "flex",
            alignItems: "center",
          }}
        >
          Chekkify
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 500,
              lineHeight: 1.02,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Kapıda ödeme.</span>
            <span style={{ color: "#FB7185" }}>Akıllı onay.</span>
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#a1a1aa",
              maxWidth: 880,
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            Otomatik SMS doğrulamayla iptal oranını düşür. Türkiye'nin
            Apple-pro Shopify COD asistanı.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#71717a",
            fontSize: 20,
          }}
        >
          <span>chekkify.com</span>
          <span>14 gün ücretsiz dene</span>
        </div>
      </div>
    ),
    size
  );
}
