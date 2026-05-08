import * as React from "react";
import Logo from "@/components/Logo";
import { TrustBar } from "@/components/ui/trust-bar";
import { cn } from "@/lib/utils";

export interface MerchantBrandedLayoutProps {
  /**
   * Optional shop name shown as a subtitle next to the Chekkify wordmark.
   * Branding override (logo / color) is intentionally out of scope for M3
   * — backend has no shop branding fields yet. Falls through to defaults.
   */
  shopName?: string;
  hideTrustBar?: boolean;
  /** Slot for a sticky bottom CTA on mobile (PrimaryActionButton). */
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function MerchantBrandedLayout({
  shopName,
  hideTrustBar,
  footer,
  className,
  children,
}: MerchantBrandedLayoutProps) {
  return (
    <div className="app-shell relative min-h-[100dvh] bg-[var(--color-bg)]">
      {/* Single ambient coral glow — quieter than auth surfaces */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 40% at 50% -10%, rgba(251,113,133,0.18) 0%, transparent 70%)",
        }}
      />

      <main
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-[480px] flex-col px-5 pt-10 pb-12",
          "min-h-[100dvh]",
          className
        )}
      >
        <header className="mb-8 flex flex-col items-center text-center">
          <Logo size="md" />
          {shopName && (
            <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">
              {shopName}
            </p>
          )}
        </header>

        <div className="flex-1">{children}</div>

        {!hideTrustBar && <TrustBar />}
      </main>

      {footer && (
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-bg)]/90 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur-xl md:hidden"
        >
          <div className="mx-auto w-full max-w-[440px]">{footer}</div>
        </div>
      )}
      {footer && (
        <div className="hidden md:block">
          <div className="mx-auto -mt-4 w-full max-w-[440px] px-5 pb-12">{footer}</div>
        </div>
      )}
    </div>
  );
}
