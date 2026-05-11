"use client";

import { useTranslation } from "@/lib/i18n";

export default function SkipLink() {
  const { t } = useTranslation();
  return (
    <a href="#main-content" className="skip-link">
      {t("site_a11y_skip_to_content")}
    </a>
  );
}
