"use client";

import { CheckCircle2, XCircle, Mail, MessageSquare } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface RecoveryEvent {
  id: string;
  channel: string;
  template: string;
  sentAt: string;
  delivered: boolean;
  clicked: boolean;
  clickedAt: string | null;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TEMPLATE_KEY: Record<string, TranslationKey> = {
  first_reminder: "recover_template_first_reminder",
  second_reminder: "recover_template_second_reminder",
  final: "recover_template_final",
  manual_reminder: "recover_template_manual_reminder",
};

export function RecoveryTimeline({ events }: { events: RecoveryEvent[] }) {
  const { t } = useTranslation();

  if (events.length === 0) {
    return (
      <p className="text-[13px] text-[var(--color-fg-faint)]">
        {t("recover_timeline_empty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {events.map((event) => {
        const Channel = event.channel === "email" ? Mail : MessageSquare;
        const StatusIcon = event.delivered ? CheckCircle2 : XCircle;
        const okClass = event.delivered
          ? "text-[var(--color-success)] border-[var(--color-success)]/30 bg-[var(--color-success)]/[0.06]"
          : "text-[var(--color-danger)] border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.06]";

        const templateKey = TEMPLATE_KEY[event.template];
        const templateLabel = templateKey ? t(templateKey) : event.template;

        return (
          <li
            key={event.id}
            className={cn(
              "flex items-start gap-3 rounded-[var(--radius-md)] border p-3",
              okClass,
            )}
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-fg-muted)]">
              <Channel size={14} strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <span>{templateLabel}</span>
                <span className="text-[var(--color-fg-faint)]">·</span>
                <span className="text-[11px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                  {event.channel === "email"
                    ? t("recover_channel_email")
                    : t("recover_channel_sms")}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[12px]">
                <StatusIcon size={12} aria-hidden />
                <span>
                  {event.delivered
                    ? t("recover_timeline_delivered")
                    : t("recover_timeline_failed")}
                </span>
                <span className="text-[var(--color-fg-faint)]">·</span>
                <span className="tabular-nums text-[var(--color-fg-muted)]">
                  {formatDateTime(event.sentAt)}
                </span>
                {event.clicked && event.clickedAt && (
                  <>
                    <span className="text-[var(--color-fg-faint)]">·</span>
                    <span className="text-[var(--color-accent)]">
                      {t("recover_timeline_clicked")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
