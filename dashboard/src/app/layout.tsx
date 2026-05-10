import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import NextAuthProvider from "@/components/NextAuthProvider";
import { LanguageProvider } from "@/lib/i18n";
import { SmoothScroll } from "@/components/SmoothScroll";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chekkify.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Chekkify — Kapıda ödeme. Akıllı onay.",
    template: "%s · Chekkify",
  },
  description:
    "Otomatik SMS doğrulamayla iptal oranını düşür. Müşterilerin hızlıca onaylar, sen işine odaklanırsın. Türkiye'nin akıllı Shopify COD asistanı.",
  applicationName: "Chekkify",
  keywords: [
    "kapıda ödeme",
    "COD doğrulama",
    "Shopify COD",
    "SMS doğrulama",
    "iade oranı",
    "OTP doğrulama",
    "Türkiye Shopify uygulaması",
  ],
  authors: [{ name: "Chekkify" }],
  creator: "Chekkify",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: SITE_URL,
    siteName: "Chekkify",
    title: "Chekkify — Kapıda ödeme. Akıllı onay.",
    description:
      "Otomatik SMS doğrulamayla iptal oranını düşür. Türkiye'nin akıllı Shopify COD asistanı.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chekkify — Kapıda ödeme. Akıllı onay.",
    description:
      "Otomatik SMS doğrulamayla iptal oranını düşür. Türkiye'nin akıllı Shopify COD asistanı.",
  },
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chekkify",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-180.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={GeistSans.className}>
        <a href="#main-content" className="skip-link">
          İçeriğe atla
        </a>
        <NextAuthProvider>
          <LanguageProvider>
            <ToastProvider>
              <SmoothScroll />
              {children}
            </ToastProvider>
          </LanguageProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
