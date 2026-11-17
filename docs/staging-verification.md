# Private-beta staging verification

Run this on a restored staging Supabase project before granting any family access. Do not run the test bootstrap against production.

## Required configuration

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server/deployment secret only
- `RK_BETA_ALLOWED_EMAILS` — exact guardian-email allow-list
- `RK_BETA_MODE=true`

## Database and identity

1. Back up the staging schema and record the Supabase migration ledger.
2. Reconcile the actual schema with migrations `000_profiles_baseline.sql`, `20260226_init_hub.sql`, and `006_game_persistence_security.sql`. Stop if profiles are not UUID-based or history differs.
3. Create two guardian accounts and two student profiles. Link each guardian to only one student through `student_guardians`.
4. Obtain real access tokens by signing in through Supabase Auth. Do not substitute a locally forged JWT.
5. Through PostgREST, verify: Guardian A can read/write only their student's game progress and sessions; Guardian A cannot read/write Guardian B's records; an unlinked invited account cannot access either student; anonymous access is denied.
6. Request a quarterly report as Guardian A for Student A (200); request Student B's report as Guardian A (403); retry without a token (401); retry with a non-invited signed-in email (403).
7. Confirm `/api/messages/send` returns 503 for GET and POST and never returns message rows.

## Build and deployment

1. Supply or regenerate a reviewed root `package-lock.json`; it is required for repeatable `npm ci`.
2. Run `npm ci`, `npm run typecheck`, `npm run lint`, and `npm run build`.
3. Run the disposable-database suites in `docs/solfege-launch.md`.
4. Make database-security and build checks required before merging.
5. Deploy only to staging; review logs for configuration or authorization errors.

## Payments

Square is the selected provider for a later public release. This beta has no checkout, payment wall, webhook, or payment credential. Do not add Square keys or webhook URLs to the beta environment.
