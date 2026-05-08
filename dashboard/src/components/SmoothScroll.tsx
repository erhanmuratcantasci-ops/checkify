"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Marketing-only smooth scroll wrapper. Active on the public marketing routes
 * (/, /iletisim, /blog, …); explicitly bypassed inside the (auth) /
 * (dashboard) groups and the customer COD form so app surfaces keep native
 * scrolling. Reduced-motion users always get native scroll.
 */
const ACTIVE_PATHS = [
  "/",
  "/iletisim",
  "/blog",
  "/privacy",
  "/gizlilik",
  "/terms",
  "/kvkk",
];

export function SmoothScroll() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    const isMarketing = ACTIVE_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    if (!isMarketing) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      // Faster than M4 default (1.05). Apple-style scroll feels alert,
      // not draggy — the cubic eases out so it still settles smoothly.
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1.2,
      touchMultiplier: 2,
      smoothWheel: true,
    });

    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
