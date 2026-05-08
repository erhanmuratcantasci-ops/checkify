"use client";

import { useAppBridge } from "@shopify/app-bridge-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Fetcher that automatically attaches a fresh Shopify session token.
 *
 * Embedded-app routes call backend endpoints under /shopify-session/* and
 * the matching shopifySessionToken middleware verifies the JWT on every
 * request. Tokens are short-lived (~1 minute) so we always grab a new one
 * via `shopify.idToken()` right before the fetch — App Bridge handles its
 * own caching/refresh.
 *
 * Usage:
 *   const apiCall = useShopifyApi();
 *   const data = await apiCall("/shops/me").then((r) => r.json());
 */
export function useShopifyApi() {
  const shopify = useAppBridge();

  return async (path: string, init: RequestInit = {}): Promise<Response> => {
    const token = await shopify.idToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return fetch(`${API}${path}`, { ...init, headers });
  };
}
