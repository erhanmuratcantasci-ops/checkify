"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, type LucideIcon } from "lucide-react";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface FeatureSectionProps {
  eyebrow?: string;
  title: string;
  body: string;
  bullets: string[];
  reverse?: boolean;
  icon?: LucideIcon;
  visual: React.ReactNode;
  className?: string;
}

export function FeatureSection({
  eyebrow,
  title,
  body,
  bullets,
  reverse,
  icon: Icon,
  visual,
  className,
}: FeatureSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, ease: easeOut }}
      className={cn(
        "grid items-center gap-10 py-20 md:grid-cols-2 md:gap-14 md:py-32",
        className
      )}
    >
      <div className={cn("min-w-0", reverse && "md:order-2")}>
        {eyebrow && (
          <p className="mb-4 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.08em] text-[var(--color-accent)]">
            {Icon && <Icon size={14} aria-hidden />}
            {eyebrow}
          </p>
        )}
        <h2
          className="text-[var(--color-fg)]"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 500,
            letterSpacing: "var(--tracking-display)",
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          {title}
        </h2>
        <p
          className="mt-5 max-w-[42ch] text-[var(--color-fg-muted)]"
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            letterSpacing: "var(--tracking-body)",
          }}
        >
          {body}
        </p>
        <ul className="mt-7 space-y-3">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-3 text-[15px] text-[var(--color-fg)]"
            >
              <Check
                size={18}
                strokeWidth={2}
                aria-hidden
                className="mt-0.5 shrink-0 text-[var(--color-accent)]"
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={cn("min-w-0", reverse && "md:order-1")}>{visual}</div>
    </motion.section>
  );
}
