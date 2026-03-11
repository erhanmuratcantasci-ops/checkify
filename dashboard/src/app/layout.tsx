import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import NextAuthProvider from "@/components/NextAuthProvider";

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
        <script type="text/javascript" dangerouslySetInnerHTML={{__html: `window.$crisp=[];window.CRISP_WEBSITE_ID="afd394ef-ef8f-46f8-8823-84338ea35cd4";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`}} />
      </head>
      <body className="antialiased">
        <NextAuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
