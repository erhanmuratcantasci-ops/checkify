"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "block text-[13px] text-[var(--color-fg-muted)] tracking-[-0.005em] mb-2",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";
