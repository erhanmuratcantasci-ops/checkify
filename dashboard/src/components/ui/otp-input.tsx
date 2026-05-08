"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (next: string) => void;
  onComplete?: (full: string) => void;
  onPasteToast?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Mobile-first numeric OTP grid.
 *
 * - inputMode="numeric" so iOS shows the digit pad
 * - Auto-advance on type, backspace falls back to the previous box
 * - Paste a full 6-digit string anywhere → fills every box and fires
 *   onPasteToast so the parent can surface a "Kod yapıştırıldı" toast
 * - Each filled box gets a subtle scale spring, focused box gets the
 *   coral border + glow ring used elsewhere in M1/M2
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  onPasteToast,
  disabled,
  invalid,
  autoFocus = true,
  className,
  ...rest
}: OTPInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = React.useMemo(() => {
    const padded = (value ?? "").padEnd(length, " ");
    return Array.from({ length }, (_, i) => {
      const ch = padded[i];
      return ch && ch !== " " ? ch : "";
    });
  }, [value, length]);

  React.useEffect(() => {
    if (autoFocus && !disabled) refs.current[0]?.focus();
  }, [autoFocus, disabled]);

  function setAt(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    const joined = next.join("");
    onChange(joined);
    if (joined.length === length && !joined.includes("")) {
      onComplete?.(joined);
    }
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setAt(index, digit);
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted.length < 2) return;
    e.preventDefault();
    const sliced = pasted.slice(0, length);
    onChange(sliced);
    if (sliced.length === length) onComplete?.(sliced);
    refs.current[Math.min(sliced.length, length - 1)]?.focus();
    onPasteToast?.();
  }

  return (
    <div
      role="group"
      aria-label={rest["aria-label"] ?? "Doğrulama kodu"}
      className={cn("flex items-center justify-center gap-2 sm:gap-2.5", className)}
    >
      {digits.map((digit, i) => {
        const filled = Boolean(digit);
        return (
          <motion.input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={disabled}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-invalid={invalid || undefined}
            aria-label={`Hane ${i + 1}`}
            animate={{ scale: filled ? 1.04 : 1 }}
            transition={{ type: "spring", stiffness: 480, damping: 26, mass: 0.6 }}
            className={cn(
              "h-14 w-12 rounded-[var(--radius-md)] border bg-[var(--color-bg-elevated)] text-center text-[24px] font-medium tabular-nums text-[var(--color-fg)] outline-none transition-colors duration-150",
              "focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)]",
              filled
                ? "border-[var(--color-accent)]/40"
                : "border-[var(--color-border)]",
              invalid && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_4px_rgba(248,113,113,0.18)]",
              disabled && "opacity-50"
            )}
          />
        );
      })}
    </div>
  );
}
