# i18n Coverage — Sprint 3.6 + future scope

Sprint 3.5 (this PR) coverage gap sweep handled **18 dosya** — auth flow, dashboard core, global components, error/skip-link, marketing surface, MarketingCTA + FAQ. Remaining hardcoded TR strings are tracked here by priority.

## Numbers

| | TR satır (grep `[ıİğĞşŞüÜöÖçÇ]`) |
|---|---|
| Master (Sprint 3 end) | 832 |
| After Sprint 3.5 | 690 |
| Reduction | −142 (~17%) |

i18n.tsx key count: **277 (Sprint 3) → 609 (Sprint 3 coverage) → 622 (Sprint 3.5, +13 new keys)** (`landing_cta_*`, `landing_faq_heading`, `landing_pricing_*` extensions).

## Remaining buckets

### Sprint 3.6 — high-value dashboard surface (~150 satır)

| Dosya | TR satır | Notlar |
|---|---|---|
| `app/(dashboard)/orders/[id]/page.tsx` | 22 | Order detail page; STATUS_LABELS refactor + modal copy |
| `app/(dashboard)/pricing/page.tsx` | 17 | Inner pricing page (merchant-facing); mostly mirrors `landing_pricing_*` keys but layout differs from marketing |
| `app/(dashboard)/blocklist/page.tsx` | 15 | Phone/postal block list page; keys already exist in i18n.tsx (`blocklist_*`) |
| `app/(dashboard)/sms-logs/page.tsx` | 14 | SMS history; keys already exist (`smslogs_*`) |
| `app/(dashboard)/rto/page.tsx` | ~11 | RTO analytics; keys already exist (`rto_*`) |
| `app/(dashboard)/credits/page.tsx` | ~9 | Credit balance + custom purchase; keys exist (`credits_*` extensions) |
| `components/PlanUpgradeOverlay.tsx` constants | ~10 | `UPGRADE_PLANS` price/feature TR strings remain; component scope already fixed but plan-feature data needs t() conversion |

### Sprint 3.6 — blocking-rules module (~75 satır)

i18n keys already added (`blocking_*` family, 75+ keys). Just needs JSX wiring:

| Dosya | TR satır |
|---|---|
| `(dashboard)/blocking-rules/page.tsx` | 10 |
| `(dashboard)/blocking-rules/components/RulesTab.tsx` | 35 |
| `(dashboard)/blocking-rules/components/StatsTab.tsx` | 18 |
| `(dashboard)/blocking-rules/components/SettingsTab.tsx` | 13 |
| `(dashboard)/blocking-rules/components/BlockedOrdersTab.tsx` | 9 |

### Sprint 3.6 — customer-token + auth edges (~26 satır)

| Dosya | TR satır | Notlar |
|---|---|---|
| `app/reset-password/[token]/page.tsx` | 12 | Customer-facing; keys exist (`cod_reset_password_*`). **Also needs `FixedLanguageProvider` hard-pin TR** (like `/confirm/*` pattern, Sprint 3 Karar 3) |
| `app/verify/[orderId]/page.tsx` | ~5 | OTP customer page; keys exist |
| `app/status/[token]/page.tsx` | ~5 | Status customer page; keys exist |
| `app/admin/(auth)/reset-password/page.tsx` | 14 | Admin reset; admin-only, low priority |

### Sprint 3.6 — visual showcase data (~24 satır)

Marketing/dashboard visuals with sample copy. These are showcase props (Turkish customer names, currency, sample order data) — translation requires either bilingual mock data or rendering EN versions:

| Dosya | TR satır | Strategy |
|---|---|---|
| `components/marketing/FeaturesGroup.tsx` (SmsVisual, ConsoleVisual, BlockingVisual) | 11 | Sample order names ("Mehmet Demir", currency ₺), TR-specific. Either: (a) duplicate visual components per locale, (b) parameterize sample data, (c) ship TR-only showcase to EN audience |
| `components/marketing/HeroDashboardMockup.tsx` | 13 | Mock dashboard metrics with TR; keys exist (`landing_mockup_*`) |
| `app/opengraph-image.tsx` | 6 | Server-rendered OG image; needs locale-aware variant |

### Sprint 2 — legal/static (~113 satır) — KVKK + GDPR scope

| Dosya | TR satır | Notlar |
|---|---|---|
| `app/kvkk/page.tsx` | 26 | KVKK (Turkish law) — TR-specific, keep TR |
| `app/terms/page.tsx` | 29 | Kullanım Koşulları — needs Terms of Service (EN) sibling |
| `app/privacy/page.tsx` | 28 | Privacy text |
| `app/gizlilik/page.tsx` | 20 | Older TR privacy (deprecated?) |
| `app/iletisim/page.tsx` | ~10 | Contact page; simple, can be i18n'd but Sprint 2 handles legal pages holistically |

Sprint 2 plan: route restructure (`/privacy` for EN, `/gizlilik` for TR, `/kvkk` TR-only, `/terms` ⇄ `/kullanim-kosullari` etc.) with locale-aware redirects.

### Out-of-scope (intentional)

| Dosya | TR satır | Reason |
|---|---|---|
| `app/blog/data.ts` | 150 | Blog post **content** (article body), not i18n. Either bilingual blog system or CMS migration |
| `app/admin/(panel)/page.tsx` | 82 | Admin panel — Erhan-only, customer-base etkilenmez |
| `app/embedded/page.tsx` + `embedded/onboarding/page.tsx` | 42 | Shopify embedded routes use Polaris built-in i18n |
| `lib/api.ts` | ~5 | Throwing utility, no hook context. Pattern: callers use `err instanceof Error ? err.message : t('error_api_default')`. Future: ApiError gets a `messageKey` field or wrapper hook |
| `app/layout.tsx` metadata description (TR keywords array, OG/twitter copy) | ~12 | Next.js Metadata API is RSC; metadata is server-rendered once and cached. Sprint 3.5 split skip-link to client component (`SkipLink.tsx`); metadata.description i18n would require dynamic Metadata factory per locale — pending architecture decision |

## Re-running the coverage sweep

```bash
# Total TR-character lines (excluding i18n.tsx)
grep -rE "[ıİğĞşŞüÜöÖçÇ]" dashboard/src --include="*.tsx" --include="*.ts" | grep -v "i18n.tsx" | wc -l

# Per-file breakdown
grep -rEl "[ıİğĞşŞüÜöÖçÇ]" dashboard/src --include="*.tsx" --include="*.ts" \
  | grep -v "i18n.tsx" \
  | while read f; do cnt=$(grep -cE "[ıİğĞşŞüÜöÖçÇ]" "$f"); echo "$cnt $f"; done \
  | sort -rn | head -20
```

## i18n.tsx growth log

- Sprint 3 (PR #4): 277 keys (TR + EN parallel)
- Sprint 3 coverage gap (this PR, batch 1): +332 keys → 609
- Sprint 3.5 commits (this PR, marketing tail): +13 keys → 622
  - `landing_cta_heading`, `landing_cta_subtitle`, `landing_cta_see_plans`, `landing_cta_30sec_setup` (MarketingCTA)
  - `landing_faq_heading` (MarketingFAQ)
  - `landing_pricing_heading`, `landing_pricing_subhead` (MarketingPricing)
  - `landing_pricing_feature_basic_sms`, `..._pdf_invoice`, `..._whatsapp`, `..._rto`, `..._blocklist`, `..._postal_code` (pricing feature labels)
