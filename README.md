# RK Homeschool Hub

<!-- CI badge placeholder — add the real badge URL once a general build workflow lands on main. -->
<!-- [![CI](https://github.com/juliampadron/RK-HOMESCHOOL-HUB-1.1/actions/workflows/ci.yml/badge.svg)](https://github.com/juliampadron/RK-HOMESCHOOL-HUB-1.1/actions/workflows/ci.yml) -->

Invitation-only Homeschool Hub for Renaissance Kids, Inc. — a Next.js 14 app where
enrolled families practice with learning games (starting with the Solfege Staircase
ear-training game) and guardians request quarterly home-instruction (IHIP) reports.

> **Status: private beta, not a public release.** Access is invitation-only for
> fewer than ten currently enrolled families. There is no checkout, no payment
> wall, no public registration, and no family messaging in beta. Game scores are
> practice data — not grades, not proof of mastery. See
> [`docs/beta-launch.md`](docs/beta-launch.md) and
> [`docs/merge-readiness.md`](docs/merge-readiness.md).

## Quickstart

Requires **Node.js ≥ 20.9.0** (the repo is verified on Node 20/22; see
`.github/workflows/beta-build.yml`).

```bash
git clone https://github.com/juliampadron/RK-HOMESCHOOL-HUB-1.1.git
cd RK-HOMESCHOOL-HUB-1.1
cp .env.example .env.local   # then fill in real values — never commit .env.local
npm ci
npm run typecheck
npm run lint
npm run build
npm run dev                  # http://localhost:3000
```

### Tests

```bash
node tests/client/persistence.mjs   # Solfege client persistence checks (mocked Supabase)
npm run test:db                     # Database + RLS suite — needs a disposable Postgres
                                    # (scripts/test-database.sh; set DATABASE_URL to an
                                    # empty disposable database. Never run against staging
                                    # or production.)
```

CI runs the database/R L S suite on every pull request
(`.github/workflows/database-security.yml`).

## Environment variables

Copy `.env.example` to `.env.local` and fill in values from the Supabase dashboard
(Settings → API) and the Renaissance Kids office records. **Never commit real values.**
`.env.local` must stay out of git (see `.gitignore`).

| Variable | Required | Example / placeholder | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://abcdefghijklm.supabase.co` | Public project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `eyJhbGciOi...` (anon/public key) | Public anon key — safe to expose in the browser; RLS is what protects data. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server only) | `eyJhbGciOi...` (service_role key) | **Server secret. Never put in a browser, email, Drive doc, or client-side env var.** Used only in `src/lib/betaAuth.ts` (server routes). |
| `RK_BETA_ALLOWED_EMAILS` | Yes (beta) | `guardian1@example.com,guardian2@example.com` | Exact, lowercase, comma-separated allow-list of invited guardian emails. Source of truth is the office's current enrollment records — never add a family from a URL, form submission, or caller-supplied ID. |
| `RK_BETA_MODE` | Yes (beta) | `true` | Keep `true` for the whole beta. Removing beta mode is a separate, reviewed release. |

No payment credentials belong in the beta environment. **Stripe is not used by this
repo** (no Stripe dependency, key, or webhook anywhere in the tree). Square is the
selected payment provider for a later public release; do not add Square keys or
webhook URLs until that release is planned. See `docs/staging-verification.md`.

## Supabase setup

1. Create a Supabase project (staging first — never develop against production).
2. Apply the migrations in order from `supabase/migrations/`:
   `000_profiles_baseline.sql`, `001_student_skills.sql`,
   `002_educator_assessments.sql`, `003_worksheet_logs.sql`,
   `005_games_rls_and_seed.sql`, `006_game_persistence_security.sql`,
   `20260226_init_hub.sql`.
   > ⚠️ **Known gap (release blocker, Nov 2026):** there is no `004` migration in
   > this tree. `004_reports_storage.sql` lives only in unmerged PR #26 and
   > `004_payment_enrollment_system.sql` only in unmerged PR #30. Do not renumber
   > or invent a 004 — resolve the gap in a reviewed PR first. See `CHANGELOG.md`.
3. **Enable Row Level Security on every table that holds student data** and verify
   the policies in `006_game_persistence_security.sql` plus
   `tests/database/rls.sql`. RLS is the only thing standing between the public
   anon key and student rows — Supabase's default grants give `anon` /
   `authenticated` broad table access when RLS is off.
   > ⚠️ **Known gap (release blocker, Nov 2026):** RLS is enabled only on the
   > game tables added in 006. `profiles`, `skill_progress_history`,
   > `educator_assessments`, `assessment_skill_links`, `worksheet_logs`, and
   > `hub_resources` have **no RLS enabled** in any migration, and
   > `student_skills` has RLS enabled with **no policy at all** (its only policy
   > was dropped by 006 with no replacement). Do not ship publicly until a
   > reviewed migration closes these gaps and `tests/database/rls.sql` covers
   > them. See `CHANGELOG.md`.
4. Create two guardian accounts and two student profiles in staging, link each
   guardian to only one student through `student_guardians` (administrator-only
   database connection — never through the browser), and run the full sequence in
   `docs/staging-verification.md` with real Supabase Auth JWTs (never locally
   forged tokens). Confirm the 9-item sign-off record in
   `docs/merge-readiness.md` before inviting any family.
5. Keep `SUPABASE_SERVICE_ROLE_KEY` a server/deployment secret only.

## Payments / webhooks

There is **no checkout in beta** (`src/app/api/checkout/route.ts` returns 503 by
design; `/api/messages/send` is likewise disabled). When a public release adds
payments, the provider is Square (per `docs/staging-verification.md` and
`docs/merge-readiness.md`) — webhook setup, signature verification, and test-mode
flow are deferred to that release and must land as their own reviewed change.
Do not add payment keys to the beta environment.

## Project layout

- `src/app/` — Next.js App Router: `/` (home), `/homeschool-hub/solfege-staircase`
  (game), `/api/checkout` (disabled), `/api/messages/send` (disabled),
  `/api/reports/ihip/quarterly` (guardian-authorized quarterly reports).
- `src/lib/betaAuth.ts` — beta allow-list + service-role admin client (server only).
- `src/components/games/` — game UI, including the Solfege launch card.
- `supabase/migrations/` — schema + RLS (see the gaps noted above).
- `tests/client/persistence.mjs` — mocked client persistence checks.
- `tests/database/` — disposable-database RLS/security suite.
- `docs/` — `beta-launch.md`, `merge-readiness.md`, `staging-verification.md`,
  `api-route-contracts.md`, `nys-homeschool-evidence-crosswalk.md`,
  `science-3-5-operations-index.md`, `solfege-launch.md`.
- `content/`, `public/` — planning notes, templates, static game fallback.

## Child data & privacy

This platform stores student PII (profiles, game progress, skills, assessments,
worksheet logs) for children in grades 3–5. **As of November 2026 the repo has no
privacy policy, no terms of service, and no COPPA compliance note** — the only
mention is a "deferred before public launch" row in `docs/merge-readiness.md`.
That is a release blocker: do not invite families or go public until the privacy
policy, terms, and COPPA review are written, reviewed, and linked from the app.
Parent/guardian consent handling, data-retention rules, and the quarterly-report
honesty rules (actual hours only, per-subject coverage with explanations, no
invented credits or dates, draft/blocked states instead of fabricated submissions)
are part of that review.

## License

No license file is present yet — see the license-decision issue. Do not reuse this
code commercially until a license is chosen and committed.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). In short: small PRs, run
`npm ci && npm run typecheck && npm run lint && npm run build` plus
`node tests/client/persistence.mjs` before opening a PR, never touch live data,
and never put secrets in the repo.
