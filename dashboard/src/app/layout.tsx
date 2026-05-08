import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import NextAuthProvider from "@/components/NextAuthProvider";
import { LanguageProvider } from "@/lib/i18n";
import { SmoothScroll } from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Chekkify",
  description: "Chekkify — Shopify COD doğrulama platformu",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chekkify",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={GeistSans.className}>
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
