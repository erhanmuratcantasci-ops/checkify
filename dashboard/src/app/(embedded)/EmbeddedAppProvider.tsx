"use client";

import { AppProvider } from "@shopify/polaris";
import polarisTr from "@shopify/polaris/locales/tr.json";

/**
 * Polaris AppProvider configured for the embedded shell:
 * - tr-TR locale (Polaris built-in copy)
 * - Forced dark color-scheme via data attribute (the override CSS reads
 *   `[data-color-scheme="dark"]` and remaps Polaris tokens onto our
 *   Apple-pro palette).
 *
 * The Shopify App Bridge script tag is loaded one level up in
 * (embedded)/layout.tsx and auto-initializes the global `shopify` object
 * — `useAppBridge()` calls in child components pick it up directly.
 */
export function EmbeddedAppProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider i18n={polarisTr}>
      <div className="embedded-shell" data-color-scheme="dark">
        {children}
      </div>
    </AppProvider>
  );
}
