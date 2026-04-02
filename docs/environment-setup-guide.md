# Environment Setup Guide

## Required Variables

Create a `.env.local` file in the project root with the following values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
CHECKR_API_KEY=
CHECKR_WEBHOOK_SECRET=
```

## Local Start Checklist

1. Install dependencies (if package manifests are present).
2. Apply Supabase migrations in `supabase/migrations`.
3. Start the web app and verify API routes:
   - `POST /api/checkout`
   - `POST /api/webhooks/checkr`
4. Send a test webhook payload to ensure signature handling is configured.

## Security Notes

- Never commit `.env.local`.
- Rotate secrets before production launch.
- Use different keys for development and production environments.
