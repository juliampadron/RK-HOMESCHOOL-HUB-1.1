# Deployment Guide

## 1) Pre-Deploy

- Confirm all DB migrations have been applied.
- Confirm `CHECKR_API_KEY` and `CHECKR_WEBHOOK_SECRET` are set in the hosting environment.
- Confirm Stripe webhook endpoint secret is configured.

## 2) Deploy Steps

1. Build and deploy the application.
2. Configure webhook endpoints:
   - Stripe: `/api/webhooks/stripe`
   - Checkr: `/api/webhooks/checkr`
3. Run smoke tests against checkout and webhook routes.

## 3) Post-Deploy Verification

- Ensure background check fields are being updated on `instructor_profiles`.
- Ensure webhook request failures are logged and alertable.
- Confirm public game URLs are reachable:
  - `/homeschool-hub/solfege-staircase/`

## 4) Rollback Plan

- Roll back application build.
- Revert latest migration only if it is safe and no production data relies on new columns.
- Re-run smoke tests after rollback.
