import { FixedLanguageProvider } from "@/lib/i18n";

/**
 * Customer-facing order status flow hard-pinned to Turkish for V1
 * (Sprint 3 Karar 3). /status/[token] is reached via the post-confirm
 * tracking link; locale will come from the SMS link payload in V2.
 */
export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <FixedLanguageProvider lang="tr">{children}</FixedLanguageProvider>;
}
