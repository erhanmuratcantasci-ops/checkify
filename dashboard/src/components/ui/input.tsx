"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  inputSize?: "md" | "lg";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, inputSize = "md", ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full bg-[var(--color-bg-elevated)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)]",
          "rounded-[10px] px-4",
          inputSize === "lg" ? "h-14 text-[16px]" : "h-12 text-[15px]",
          "border border-[var(--color-border)]",
          "outline-none transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          invalid && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_4px_rgba(248,113,113,0.18)]",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
