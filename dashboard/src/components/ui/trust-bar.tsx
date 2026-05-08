import { Lock } from "lucide-react";

export function TrustBar() {
  return (
    <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--color-fg-faint)] opacity-80">
      <Lock size={11} aria-hidden />
      <a
        href="/kvkk"
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-dotted underline-offset-2 transition-colors hover:text-[var(--color-fg-muted)]"
      >
        KVKK uyumlu
      </a>
      <span aria-hidden>·</span>
      <span>Powered by Chekkify</span>
    </p>
  );
}
