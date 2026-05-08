"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Primary CTA used on customer COD surfaces. Mirrors the `Button` primitive
 * api but adds a subtle coral linear-gradient — the customer flow only ever
 * has one CTA at a time, so it can carry a bit more visual weight than the
 * dashboard's flat coral. Min-height 52px keeps the iOS tap target healthy.
 */
export interface PrimaryActionButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  loading?: boolean;
  block?: boolean;
  children?: React.ReactNode;
}

export const PrimaryActionButton = React.forwardRef<
  HTMLButtonElement,
  PrimaryActionButtonProps
>(({ className, loading, disabled, block = true, children, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex h-[52px] items-center justify-center gap-2 rounded-[var(--radius-md)] px-6 text-[15px] font-medium text-[var(--color-accent-fg)] tracking-[-0.011em]",
        "transition-[opacity,filter] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)] focus-visible:shadow-[var(--shadow-glow)]",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none",
        block && "w-full",
        className
      )}
      style={{
        background:
          "linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent-active) 100%)",
        boxShadow:
          "0 8px 24px -8px rgba(251,113,133,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      <>{children}</>
    </motion.button>
  );
});
PrimaryActionButton.displayName = "PrimaryActionButton";
