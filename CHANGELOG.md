# Changelog

All notable changes to the RK Homeschool Hub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
once it has a first public release.

## [Unreleased]

### Audit findings — public-release prep audit, 2026-11-18 (refs: main @ a011715, PR #36 head b6629ae, PR #37 head 5e06440)

**Release-blockers (hard stop — no public release, no launch PR until cleared):**

- **Missing RLS on student-PII tables.** After a fresh install of every migration
  in the tree, Row Level Security is enabled only on the game tables from
  `006_game_persistence_security.sql` (`student_guardians`, `games`,
  `student_game_progress`, `game_sessions`, `student_skills`). These tables have
  **no RLS enabled in any migration**: `profiles` (student id, user id, username),
  `skill_progress_history`, `educator_assessments`, `assessment_skill_links`,
  `worksheet_logs`, `hub_resources`. `tests/database/bootstrap.sql` reproduces
  Supabase's broad default grants (`GRANT ALL ON TABLES TO anon, authenticated`),
  so without RLS the public anon key can reach those rows. `profiles` additionally
  has SELECT open to anon/authenticated (006 revokes writes only).
- **Missing RLS policy: `student_skills`.** Migration 006 enables RLS on
  `student_skills` and drops its only policy (`Parents manage own student skills`)
  with no replacement — authenticated reads/writes are now deny-all. Fail-closed,
  but the skills feature is inaccessible through the anon/authenticated path.
- **Missing migration 004.** The tree jumps from `003` to `005`. `004_reports_storage.sql`
  exists only in unmerged PR #26 and `004_payment_enrollment_system.sql` only in
  unmerged PR #30. The quarterly IHIP report route (`src/app/api/reports/ihip/quarterly`)
  exists without its storage migration in the release tree.
- **No COPPA / child-data compliance posture.** The platform stores student PII for
  children (grades 3–5). No privacy policy, terms of service, or COPPA note exists
  anywhere in the repo; the only mention is a "Deferred before public launch" row
  in `docs/merge-readiness.md` (PR #36).
- **README documents no environment variables.** The README on main (identical on
  PR #36) covers only the static Solfege game page — no env-var list, no Supabase
  setup, no webhook setup. `.env.example` exists only on PR #36 (names only, no
  placeholder values or comments) and is absent from main and PR #37.
- **No license.** No `LICENSE` file on any ref.

**Non-blocker gaps (separate issues, not bundled into a launch PR):**

- `.gitignore` lists only `node_modules/` — it does **not** ignore `.env*` files,
  so a `.env.local` holding real keys could be committed by accident.
- `supabase/config.toml` is absent on all refs (no local Supabase CLI config).
- No general build/lint CI for pull requests to main. `database-security.yml`
  runs the DB/RLS suite on PRs; `beta-build.yml` exists only on PR #36 and is
  scoped to that branch (it will not run after merge).
- `npm audit` could not be verified in the audit environment (registry audit
  endpoint blocked); PR #36 reports 7 advisories from its Nov 17 GitHub Actions
  run (1 moderate, 4 high, 2 critical). Re-run `npm audit` before release.
- Stripe is not used anywhere in this repo (zero mentions); Square is the selected
  payment provider for a later public release, and beta has no checkout.

**Verified clean in this audit (PR #36 head b6629ae, Node v24.22.1, 2026-11-18):**

- No committed secrets: pattern scan for Stripe keys, Supabase service-role JWTs,
  and tracked `.env` files returned zero hits on all three refs. The service-role
  key is referenced server-side only (`src/lib/betaAuth.ts`, used by the quarterly
  report route); `.env.example` holds names only.
- `node tests/client/persistence.mjs` — PASS (score save/reset, child isolation,
  duplicate submission, visible errors, auth change, stale-load cancellation,
  submission order).
- `npm run typecheck`, `npm run lint`, `npm run build` — all pass on PR #36.
- `npm run test:db` (database/RLS suite) could **not** be run locally — no
  `psql`/Postgres in the audit environment; it runs in CI via
  `.github/workflows/database-security.yml`.

### Added (docs-draft branch)

- `README.md` rewritten: purpose, quickstart, full env-var table with placeholders,
  Supabase setup (migrations + RLS), payments/webhook status, child-data notice,
  license note, contribution pointer.
- `CHANGELOG.md` (this file), `CONTRIBUTING.md`, issue and PR templates.

## [0.1.0] — Unreleased (first public tag — proposed, not cut)

- Proposed first public version once the blockers above clear and PRs #37 and #36
  land in order. No bump from the current `0.1.0` in `package.json` (PR #36);
  pre-1.0 while the schema (migration 004 gap) and the canonical data model
  (student-like `profiles` + `student_guardians` vs. adult `profiles` + separate
  `students` table) are still unsettled.
