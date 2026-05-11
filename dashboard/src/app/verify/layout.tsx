import { FixedLanguageProvider } from "@/lib/i18n";

/**
 * Customer-facing OTP verify flow hard-pinned to Turkish for V1
 * (Sprint 3 Karar 3). /verify/[orderId] is reached via the SMS link;
 * locale will come from the SMS link payload in V2.
 */
export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <FixedLanguageProvider lang="tr">{children}</FixedLanguageProvider>;
}
