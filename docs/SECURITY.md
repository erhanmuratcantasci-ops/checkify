# Chekkify Security Practices

## Secret Management

Secrets stored in:
- Railway environment variables (backend)
- Vercel environment variables (frontend)
- Resend dashboard (API keys)
- Shopify Partners (OAuth secrets)
- Cloudflare (API tokens)

Secrets NEVER committed to git. `.env.example` documents required vars.

## Rotation Schedule

- JWT secrets: every 90 days
- Database passwords: every 90 days
- API keys: every 180 days or upon compromise
- Webhook secrets: every 90 days

## Last Full Rotation

- 2026-05-09: Initial rotation after chat exposure
  - POSTGRES_PASSWORD (DB-level ALTER USER + env sync)
  - JWT_SECRET, ADMIN_JWT_SECRET
  - RESEND_API_KEY
  - REDIS_PASSWORD
  - SHOPIFY_API_SECRET, SHOPIFY_WEBHOOK_SECRET

## Postgres Rotation — Doğru Yol

Railway dashboard'da POSTGRES_PASSWORD env'i değiştirmek YETMEZ.
Postgres container init script sadece ilk başlatmada uygular.

DOĞRU YOL:
```sql
psql $DATABASE_URL
ALTER USER postgres WITH PASSWORD '<new_hex_64>';
```
Aynı session'da Railway env'i de yeni değere update.

## Incident Response

Secret compromise şüphesi:
1. Rotate immediately
2. Audit access logs
3. Notify users if breach suspected (GDPR/KVKK requirement)
