# i18n Coverage — Sprint 3.6 + future scope

Sprint 3.5 (PR #5) coverage gap sweep handled **18 dosya** — auth flow, dashboard core, global components, error/skip-link, marketing surface, MarketingCTA + FAQ. Sprint 3.6 follows with dashboard secondary pages + blocking-rules module + customer-token hard-pin.

## Numbers

| | TR satır (grep `[ıİğĞşŞüÜöÖçÇ]`) |
|---|---|
| Master (Sprint 3 end) | 832 |
| After Sprint 3.5 | 690 |
| After Sprint 3.6 | 498 |
| Reduction (cumulative) | −334 (~40%) |
| Sprint 3.6 delta | −192 |

i18n.tsx key count: **277 (Sprint 3) → 609 (Sprint 3 coverage) → 622 (Sprint 3.5) → 707 (Sprint 3.6, +85 new keys)** — new families: `orders_*` detail/status, `credits_extra_*`, `upgrade_plan_*` (overlay constants), `blocking_rule_group_*`, `blocking_stats_*_short`, `cod_reset_password_*` form labels.

## Remaining buckets

### Sprint 3.6 — DONE in PR #6 (this branch)

Cleaned in 4 commits:

| Bucket | Dosya | Sprint 3.5 satır | After 3.6 |
|---|---|---|---|
| Dashboard secondary | orders/[id], pricing, blocklist, sms-logs, rto, credits, PlanUpgradeOverlay | ~98 | 0 |
| Blocking-rules module | page + 4 tabs | ~85 | 0 |
| Customer-token | reset-password/[token], verify/[orderId], status/[token] + 3 new layouts | ~22 | 2 (verify comment + API error pattern match) |

**Visual showcase decision: (b) skip** — `HeroDashboardMockup.tsx` (~13) and `FeaturesGroup.tsx` SmsVisual/ConsoleVisual/BlockingVisual (~11) kept TR-only. These are marketing showcase mock data (Ayşe Yılmaz, Mehmet Demir, ₺549, ₺1.240). Bilingual variants would need ~12 net-new keys for specific names/currency + duplicated branching — value low (marketing site is TR-first audience). Revisit when EN landing launches.

### Sprint 4 — admin & embedded panels (~150 satır)

| Dosya | TR satır | Notlar |
|---|---|---|
| `app/admin/(panel)/page.tsx` | 82 | Admin panel — Erhan-only, customer-base etkilenmez. Low priority. |
| `app/embedded/page.tsx` | 28 | Shopify embedded — Polaris i18n available |
| `app/embedded/onboarding/page.tsx` | 14 | same |
| `app/admin/(auth)/reset-password/page.tsx` | 14 | Admin reset; admin-only |
| `app/admin/(auth)/login/page.tsx` | 7 | Admin login |
| `app/admin/(auth)/layout.tsx` | 2 | Admin shell |

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
- Sprint 3 coverage gap (PR #5, batch 1): +332 keys → 609
- Sprint 3.5 commits (PR #5, marketing tail): +13 keys → 622
  - `landing_cta_heading`, `landing_cta_subtitle`, `landing_cta_see_plans`, `landing_cta_30sec_setup` (MarketingCTA)
  - `landing_faq_heading` (MarketingFAQ)
  - `landing_pricing_heading`, `landing_pricing_subhead` (MarketingPricing)
  - `landing_pricing_feature_basic_sms`, `..._pdf_invoice`, `..._whatsapp`, `..._rto`, `..._blocklist`, `..._postal_code` (pricing feature labels)
- Sprint 3.6 commits (PR #6): +85 keys → 707
  - orders detail (8): `orders_back_label`, `orders_field_amount`, `orders_status_{pending,confirmed,cancelled,blocked}_label`, `orders_toast_status_updated`, `orders_sms_error_label`
  - credits (8): `credits_buy_{plan_action,action}`, `credits_invoice_{aria,locked_aria}`, `credits_extra_{sms,wa}_title`, `credits_unit_{sms,wp}`
  - pricing (1): `pricing_per_shop_label`
  - upgrade overlay (19): `upgrade_plan_{starter,pro,business}_{label,price}` + 13 feature labels
  - blocking-rules JSX (35): rule group titles (7), hints (3), short-form labels for stats/orders (12), settings toggle (2), error toasts (3), select shop (1), aria/delete (1+rest)
  - customer-token (11): `cod_reset_password_{new_title,min_chars_hint,password_label,confirm_label,submit_btn,submitting_btn,updated_title,updated_subtitle,login_now,back_login,generic_error}`
  - status a11y (1): `cod_status_order_aria`
  - new layouts (not keys): `reset-password/layout.tsx`, `verify/layout.tsx`, `status/layout.tsx` — `FixedLanguageProvider lang="tr"`
