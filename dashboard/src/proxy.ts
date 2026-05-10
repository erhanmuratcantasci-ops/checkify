import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge proxy: combines the existing auth gate with M5's embedded-app
 * CSP and Sprint 3's locale detection. Three responsibilities:
 *
 * 1. Auth gate — protected dashboard paths bounce to /login if the
 *    cookie token is missing.
 * 2. CSP frame-ancestors —
 *    - /embedded/*  → must be iframable by https://*.myshopify.com and
 *                     https://admin.shopify.com (Built for Shopify
 *                     requirement)
 *    - everything else → frame-ancestors 'none' + X-Frame-Options DENY
 *                        (clickjacking defence on marketing/auth/dashboard)
 * 3. Locale detection — if the `lang` cookie is missing, sniff the
 *    Accept-Language header. Any header containing "tr" wins TR; everything
 *    else falls to EN. The cookie is then set so the client-side
 *    LanguageProvider can pick it up on subsequent requests. Cookie set
 *    only when missing — explicit user choice (LanguageSwitcher click)
 *    always wins.
 */

const PROTECTED_PATHS = [
  "/dashboard",
  "/orders",
  "/profile",
  "/shops",
  "/credits",
  "/admin",
];

const SHOPIFY_FRAME_ANCESTORS = [
  "https://*.myshopify.com",
  "https://admin.shopify.com",
].join(" ");

const LANG_COOKIE = "lang";
const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function detectLocale(request: NextRequest): "tr" | "en" {
  const accept = request.headers.get("accept-language") ?? "";
  return accept.toLowerCase().includes("tr") ? "tr" : "en";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Auth gate
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 2. CSP
  const res = NextResponse.next();
  const isEmbedded = pathname.startsWith("/embedded");
  if (isEmbedded) {
    res.headers.set(
      "Content-Security-Policy",
      `frame-ancestors ${SHOPIFY_FRAME_ANCESTORS};`
    );
    // X-Frame-Options is the older spec and would block the iframe
    // regardless of CSP — explicitly drop any default.
    res.headers.delete("X-Frame-Options");
  } else {
    res.headers.set("Content-Security-Policy", "frame-ancestors 'none';");
    res.headers.set("X-Frame-Options", "DENY");
  }

  // 3. Locale cookie — set only when missing so explicit choice wins.
  if (!request.cookies.get(LANG_COOKIE)) {
    res.cookies.set(LANG_COOKIE, detectLocale(request), {
      path: "/",
      maxAge: LANG_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
