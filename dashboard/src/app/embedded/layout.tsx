import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@shopify/polaris/build/esm/styles.css";
import "./polaris-theme-override.css";
import { EmbeddedAppProvider } from "./EmbeddedAppProvider";

/**
 * Embedded-app shell. Lives at /embedded/* and gets opened by Shopify
 * Admin inside an iframe.
 *
 * The two App Bridge wiring bits — <meta name="shopify-api-key"> and the
 * https://cdn.shopify.com/shopifycloud/app-bridge.js script — are required
 * so the global `shopify` object is initialized before any React code runs.
 * React 19 hoists the <meta> tag into <head> automatically, and next/script
 * with strategy="beforeInteractive" makes sure the bridge is up before
 * useAppBridge() is called.
 *
 * Polaris styles + our override CSS are imported here so the merchant
 * dashboard surface stays untouched.
 */

export const metadata: Metadata = {
  title: "Chekkify",
  description: "Shopify Admin embedded app",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function EmbeddedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ?? "";

  return (
    <>
      {/* App Bridge expects the API key in a meta tag and auto-initializes
          the global `shopify` object via the CDN script. */}
      <meta name="shopify-api-key" content={apiKey} />
      <Script
        src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
        strategy="beforeInteractive"
      />
      <EmbeddedAppProvider>{children}</EmbeddedAppProvider>
    </>
  );
}
