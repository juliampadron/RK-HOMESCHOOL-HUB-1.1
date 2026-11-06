# Renaissance Kids Hub — Technical Deployment Guide

This guide translates the product implementation plan into an actionable production deployment runbook for **renkids.org/hub** and related subpaths.

---

## 1) Target Architecture

- **Frontend + API**: Next.js application deployed on Vercel (single project, preview + production environments).
- **Primary Database/Auth/Storage/Realtime**: Supabase Postgres + Supabase Auth + Supabase Storage.
- **Payments**: Stripe (recommended) or Square via secure webhook callbacks.
- **AI Assistant Gateway**: Server-side API routes using OpenAI-compatible provider endpoints (Fireworks AI), never exposed in client code.
- **Observability**: Sentry (errors/performance), Vercel Analytics, Supabase logs, uptime checks.

---

## 2) DNS & Domain Configuration

Use this domain strategy:

- **Marketing website**: `www.renkids.org`
- **Hub app**: `hub.renkids.org`
- **Optional API-only subdomain (if separated later)**: `api.renkids.org`

### DNS Records (recommended)

At your DNS provider for `renkids.org`:

1. `CNAME hub` → `cname.vercel-dns.com`
2. `CNAME www` → `cname.vercel-dns.com` (or your existing host target)
3. `A @` (root/apex) → your website host IP if needed (leave unchanged if already configured)
4. `TXT` records for domain verification used by Vercel/Supabase/email provider

### TLS/SSL

- Enable automatic certificate provisioning in Vercel.
- Force HTTPS redirect.
- Enable HSTS after validating all subdomains are HTTPS-ready.

### Email/DKIM/SPF/DMARC (for confirmations and receipts)

- Configure sending domain (e.g., Postmark/Resend/SendGrid).
- Publish:
  - SPF TXT
  - DKIM CNAME/TXT
  - DMARC TXT (`p=none` initially; tighten to `quarantine/reject` after validation).

---

## 3) Environments and Promotion Strategy

Define three environments:

- **Local**: Developer machines with `.env.local`.
- **Staging**: Vercel Preview or dedicated Staging project + Supabase staging project.
- **Production**: Vercel Production + Supabase production project.

### Promotion flow

1. Feature branch → Preview deploy.
2. QA and UAT sign-off in staging data scope.
3. Merge to main → production deploy.
4. Run post-deploy smoke tests + database health checks.

---

## 4) Required Environment Variables

Store all secrets in Vercel Project Settings and (where needed) Supabase Edge Function secrets.

> Never commit real secret values to the repository.

### Core app variables

```bash
# Public app URLs
NEXT_PUBLIC_APP_URL=https://hub.renkids.org
NEXT_PUBLIC_SITE_URL=https://www.renkids.org

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret-if-required-by-custom-verification>

# Auth/session
NEXTAUTH_URL=https://hub.renkids.org
NEXTAUTH_SECRET=<long-random-secret>

# Fireworks AI (OpenAI-compatible)
FIREWORKS_API_KEY=<fireworks-secret>
FIREWORKS_BASE_URL=https://api.fireworks.ai/inference/v1
AI_MODEL_PARENT_HELPER=<model-id>
AI_MODEL_STUDENT_HELPER=<model-id>

# Email provider
EMAIL_FROM="Renaissance Kids Hub <hub@renkids.org>"
EMAIL_PROVIDER_API_KEY=<email-provider-secret>

# Payments (choose one primary)
STRIPE_SECRET_KEY=<stripe-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe-public>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>

# Optional Square
SQUARE_ACCESS_TOKEN=<square-secret>
SQUARE_WEBHOOK_SIGNATURE_KEY=<square-webhook-secret>

# Monitoring
SENTRY_DSN=<sentry-dsn>
SENTRY_AUTH_TOKEN=<sentry-auth-token-for-sourcemaps>
NEXT_PUBLIC_SENTRY_DSN=<public-sentry-dsn>

# Feature toggles
FEATURE_ASSISTANT_ENABLED=true
FEATURE_WAITLIST_ENABLED=true
FEATURE_GAMIFICATION_ENABLED=true

# Security / misc
RATE_LIMIT_REDIS_URL=<upstash-or-redis-url>
RATE_LIMIT_REDIS_TOKEN=<redis-token>
ALLOWED_EXTERNAL_DOMAINS=youtube.com,khanacademy.org,smithsonianmag.com
```

### Environment variable policy

- Production and staging use separate Supabase + payment projects.
- Rotate high-risk secrets quarterly.
- Restrict service-role key usage to server routes only.
- Validate required env vars at startup and fail fast if missing.

---

## 5) Build & Runtime Settings (Vercel)

Configure Vercel project as:

- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Install Command**: your package manager command (`npm ci` or `pnpm install --frozen-lockfile`)
- **Output**: default Next.js output
- **Node Version**: Active LTS (pin exact major version across local/CI)

### Recommended Vercel project settings

- Enable branch previews.
- Enable automatic production deployment from `main`.
- Configure serverless function regions close to core users (US).
- Add WAF/rate limiting if available on plan.
- Add custom headers in Next config for:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 6) Supabase Deployment & Database Operations

### Project setup checklist

1. Create **staging** and **production** Supabase projects.
2. Apply SQL migrations in order:
   - `supabase/migrations/20260226_init_hub.sql`
   - `supabase/migrations/001_student_skills.sql`
   - `supabase/migrations/002_educator_assessments.sql`
   - `supabase/migrations/003_worksheet_logs.sql`
3. Enable Row Level Security on all user tables.
4. Add and test policies for parent/student/teacher/admin scope boundaries.
5. Configure PITR/backups and retention.

### Suggested migration command flow

```bash
supabase link --project-ref <staging-ref>
supabase db push

supabase link --project-ref <prod-ref>
supabase db push
```

### Data safety practices

- Never run destructive migrations directly in production without staging validation.
- Require SQL review for policy changes.
- Run schema diff check before each production release.

---

## 7) API, Webhooks, and Integration Security

### Webhook hardening

- Verify Stripe/Square signatures on every webhook.
- Reject unsigned or timestamp-expired webhook requests.
- Implement idempotency keys to prevent double-processing payments.
- Log webhook event IDs and processing outcomes.

### Assistant safety pipeline

- Proxy all AI requests through server routes.
- Add moderation checks before returning assistant responses.
- Persist conversation logs for parent review and audit.
- Enforce parent permission checks before student assistant access.

### Rate limiting

Apply rate limits to:

- `/api/messages/send`
- `/api/checkout`
- assistant endpoints
- auth-sensitive routes (login/reset)

---

## 8) CI/CD & Release Controls

Minimum pipeline stages:

1. Lint + typecheck.
2. Unit tests.
3. Build verification.
4. Migration dry-run check.
5. Optional end-to-end smoke tests against preview deployment.

### Release checklist (production)

- [ ] Required environment variables present.
- [ ] Migrations applied and validated.
- [ ] Payment webhooks enabled and tested in live mode.
- [ ] DNS and SSL healthy.
- [ ] Error monitoring receiving events.
- [ ] Rollback procedure verified.

---

## 9) Post-Launch Monitoring & On-Call Setup

### Error & performance monitoring

- **Sentry**:
  - Capture unhandled exceptions in client/server.
  - Capture API route errors and webhook failures.
  - Create alerts for error spike rate and p95 latency.
- **Vercel Analytics**:
  - Track Core Web Vitals (LCP, INP, CLS).
  - Alert if latency regression exceeds baseline.
- **Supabase monitoring**:
  - Slow query detection.
  - Connection saturation alerts.
  - Auth failure anomaly alerts.

### Uptime and synthetic checks

Use an external uptime monitor (e.g., Better Stack, Pingdom, UptimeRobot):

- `https://hub.renkids.org/`
- `https://hub.renkids.org/hub`
- `https://hub.renkids.org/classes`
- Health endpoint (recommended): `/api/health`

Alert channels:

- Primary: Slack #hub-alerts
- Secondary: SMS/pager for critical outages

### Operational SLOs (starter targets)

- **Availability**: 99.9% monthly
- **API p95 latency**: < 700ms for core dashboard routes
- **Enrollment submission success**: > 99.5%
- **Webhook processing success**: > 99.9%

---

## 10) Backup, Recovery, and Business Continuity

- Daily automated database backups + point-in-time recovery.
- Monthly restore drill in staging.
- Documented RTO/RPO targets:
  - RTO: 4 hours
  - RPO: 15 minutes
- Store runbook with:
  - DNS rollback steps
  - Vercel rollback steps
  - Supabase restore steps
  - Payment webhook replay procedure

---

## 11) Security & Privacy Compliance Controls

- Enforce least-privilege RBAC for admins/teachers.
- Audit-log sensitive actions (profile edits, permission changes, payment reconciliation).
- Encrypt sensitive records at rest and in transit.
- Maintain FERPA/COPPA-aligned consent, retention, and deletion workflows.
- Run quarterly dependency vulnerability scanning and patch windows.

---

## 12) Day-0 Launch Runbook (Condensed)

1. Freeze non-essential merges.
2. Confirm production env vars and domain verification.
3. Apply final migrations.
4. Deploy production build.
5. Validate smoke tests:
   - auth login/logout
   - parent dashboard load
   - enrollment draft autosave
   - submission confirmation email
   - payment checkout + webhook callback
6. Monitor dashboards closely for 2 hours.
7. Announce availability to staff and pilot families.

---

## 13) Day-1/Week-1 Post-Launch Tasks

- Review top support tickets and assistant deflection misses.
- Tune FAQ/knowledge-base content.
- Inspect slow query logs and add indexes as needed.
- Review conversion funnel for enrollment abandonment.
- Confirm weekly backup verification status.

---

## 14) Recommended Next Additions to This Repository

To make this guide fully executable, add:

- `docs/runbooks/incident-response.md`
- `docs/runbooks/database-restore.md`
- `docs/runbooks/payment-webhook-replay.md`
- `.env.example` with non-secret placeholder keys
- `src/app/api/health/route.ts` health endpoint
- CI workflow file for lint/test/build/migration checks

