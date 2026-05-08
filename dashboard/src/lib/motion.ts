import type { Transition, Variants } from "framer-motion";

export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const spring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: easeOut } },
};

/**
 * Apple-style slide-in for full-page route transitions. New page enters
 * from the right (x +20), exiting page slides slightly left (-10) and
 * fades — same vocabulary as App Store / Music navigation.
 *
 * Reduced-motion users hit the global @media clamp in globals.css
 * (animation-duration: 0.01ms) plus Framer Motion's own auto-detection,
 * so this variant is safe to use everywhere.
 */
export const pageSlide: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: easeOut } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.2, ease: easeOut } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
};

export const logoIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: easeOut } },
};

export const shake = {
  x: [-4, 4, -4, 4, 0],
  transition: { duration: 0.35 },
};
