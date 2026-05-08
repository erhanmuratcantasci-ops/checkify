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
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
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
