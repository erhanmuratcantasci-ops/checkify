import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
