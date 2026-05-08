"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TopBarProps {
  title?: string;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
  className?: string;
}

export function TopBar({ title, actions, onMenuClick, className }: TopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 px-4 backdrop-blur-xl md:px-8",
        className
      )}
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Menü"
        className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)] md:hidden"
      >
        <Menu size={20} strokeWidth={1.75} aria-hidden />
      </button>

      {title && (
        <h1
          className="flex-1 truncate text-[var(--color-fg)]"
          style={{
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "var(--tracking-heading)",
            margin: 0,
          }}
        >
          {title}
        </h1>
      )}

      {!title && <div className="flex-1" />}

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
