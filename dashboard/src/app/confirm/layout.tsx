import { FixedLanguageProvider } from "@/lib/i18n";

/**
 * Customer COD flow hard-pinned to Turkish for V1 (Sprint 3 Karar 3).
 * /confirm/[token] and /confirm/cancel/[token] always render TR
 * regardless of the merchant's LanguageSwitcher choice in
 * localStorage/cookie. EN customer strings exist in i18n.tsx but are
 * intentionally unreachable here — wired in V2 when customer locale
 * comes from the SMS link payload (Shop.locale or ?lang= param).
 */
export default function ConfirmLayout({ children }: { children: React.ReactNode }) {
  return <FixedLanguageProvider lang="tr">{children}</FixedLanguageProvider>;
}
