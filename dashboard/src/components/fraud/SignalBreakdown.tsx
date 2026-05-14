"use client";

import { useTranslation } from "@/lib/i18n";
import { Check, X } from "lucide-react";

interface Signal {
  key: string;
  weight: number;
  triggered: boolean;
  detail?: Record<string, unknown>;
}

export function SignalBreakdown({ signals }: { signals: Signal[] }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
      <table className="w-full text-[13px]">
        <thead className="bg-[var(--color-surface)] text-left text-[12px] text-[var(--color-fg-muted)]">
          <tr>
            <th className="px-3 py-2">{t("fraud_signal_col_name")}</th>
            <th className="px-3 py-2 text-right">{t("fraud_signal_col_weight")}</th>
            <th className="px-3 py-2 text-center">{t("fraud_signal_col_triggered")}</th>
            <th className="px-3 py-2">{t("fraud_signal_col_detail")}</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s) => (
            <tr key={s.key} className="border-t border-[var(--color-border)]">
              <td className="px-3 py-2 font-medium text-[var(--color-fg)]">
                {t(`fraud_signal_${s.key}` as never) || s.key}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">+{s.weight.toFixed(2)}</td>
              <td className="px-3 py-2 text-center">
                {s.triggered ? (
                  <Check size={14} className="inline text-[var(--color-danger)]" aria-hidden />
                ) : (
                  <X size={14} className="inline text-[var(--color-fg-faint)]" aria-hidden />
                )}
              </td>
              <td className="px-3 py-2 text-[var(--color-fg-muted)]">
                {s.detail ? <code className="text-[11px]">{JSON.stringify(s.detail)}</code> : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
