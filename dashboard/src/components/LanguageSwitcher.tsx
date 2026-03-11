'use client';

import { useTranslation } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang } = useTranslation();

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, overflow: 'hidden',
      flexShrink: 0,
    }}>
      {(['tr', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: '5px 10px',
            background: lang === l ? 'rgba(139,92,246,0.3)' : 'transparent',
            border: 'none',
            color: lang === l ? '#c4b5fd' : '#6b7280',
            fontSize: 12, fontWeight: 700,
            cursor: lang === l ? 'default' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'all 0.15s',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
