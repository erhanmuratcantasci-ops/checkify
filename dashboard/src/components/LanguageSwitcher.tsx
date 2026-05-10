'use client';

import { useTranslation } from '@/lib/i18n';

type Variant = 'minimal' | 'pill';

interface Props {
  variant?: Variant;
  className?: string;
}

export default function LanguageSwitcher({ variant = 'pill', className }: Props) {
  const { lang, setLang } = useTranslation();

  if (variant === 'minimal') {
    return (
      <div
        className={`inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.06em] ${className ?? ''}`}
      >
        <button
          type="button"
          onClick={() => setLang('tr')}
          aria-current={lang === 'tr' ? 'true' : undefined}
          className={
            lang === 'tr'
              ? 'font-medium text-[var(--color-fg)]'
              : 'text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)]'
          }
        >
          TR
        </button>
        <span aria-hidden className="text-[var(--color-fg-faint)]">
          |
        </span>
        <button
          type="button"
          onClick={() => setLang('en')}
          aria-current={lang === 'en' ? 'true' : undefined}
          className={
            lang === 'en'
              ? 'font-medium text-[var(--color-fg)]'
              : 'text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)]'
          }
        >
          EN
        </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 ${className ?? ''}`}
      role="group"
      aria-label="Language"
    >
      {(['tr', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-current={lang === l ? 'true' : undefined}
          className={`rounded-[var(--radius-full)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-faded)] ${
            lang === l
              ? 'bg-[var(--color-accent-faded)] text-[var(--color-accent)]'
              : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
