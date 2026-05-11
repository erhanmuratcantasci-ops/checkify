import { FixedLanguageProvider } from "@/lib/i18n";

/**
 * Customer-facing reset-password flow hard-pinned to Turkish for V1
 * (Sprint 3 Karar 3). /reset-password/[token] is reached via the email
 * link in the merchant onboarding flow; locale source is the email
 * payload (not the LanguageSwitcher cookie) — pin until V2 wires
 * shop.locale into the link.
 */
export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <FixedLanguageProvider lang="tr">{children}</FixedLanguageProvider>;
}
