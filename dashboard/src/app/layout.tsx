import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import NextAuthProvider from "@/components/NextAuthProvider";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Chekkify",
  description: "Chekkify — Shopify COD doğrulama platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <NextAuthProvider>
          <LanguageProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </LanguageProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
