# Solfege Staircase launch gate

Local database verification used PGlite (PostgreSQL compiled to WebAssembly). The GitHub workflow separately runs the SQL suites on native PostgreSQL 16; its result must be checked before merge.

This patch is based on PR #34 commit d604828096. It is a database and game-persistence fix, not approval to launch the whole application.

## Identity and permissions

- `profiles.id` is the canonical UUID student/profile identifier. It is distinct from the login UUID in `profiles.user_id`. Existing skills, assessments, and worksheets already expect UUID profile references.
- A child without a login has `profiles.user_id = NULL`. Trusted administration creates the child's profile and inserts `(student_id, guardian_user_id)` into `student_guardians` after verifying the relationship. Clients cannot add guardians or change profile ownership. Do not derive membership from a URL or accept an unverified signup claim.
- Self and verified guardians can read/write game progress and append/read session records. Teachers receive no automatic access in this patch; use a separately reviewed, explicit teacher relationship before adding teacher-facing access.
- Progress has a composite primary key and a numeric score. `save_game_progress` runs as the caller, so its fixed-conflict-key upsert remains subject to table grants and RLS. Only score can be updated, not ownership columns.
- Session identity and timestamps use database defaults. Clients cannot rewrite/delete sessions, set timestamps, or change educational mastery through the game.
- Scores and attempts are client-reported practice data, not trusted assessments or proof of mastery. Authoritative assessment requires server-validated answers and appropriate abuse controls.

## Fresh install versus existing deployments

`000_profiles_baseline.sql` precedes all profile references and rejects existing integer profile IDs. The legacy `20260226` identifier remains, but only initializes resources; it no longer recreates profiles or unrelated custom database roles. Version `005` is a placeholder; fresh game DDL and the forward hardening path are in new version `006`.

The migration chain is tested on a fresh database and on a UUID baseline with the original PR #34 `005` applied, including existing sessions, skill records, a column-level ownership grant, and a narrower resource policy. Skill RLS stays enabled without a game-write policy; legitimate assessment access needs its own reviewed policy. The upgrade removes only the broad named policies introduced by the original `005`. It preserves unrelated resource policies and educational mastery records. Existing resource RLS stays enabled; removing the broad policy can deny access until an appropriate membership policy is provided.

Before applying to any deployed project:

1. Export schema, migration ledger, grants (including column grants and inherited roles), policy definitions, and backup. Compare actual state with the reviewed branch. Do not run these migrations automatically against production.
2. Confirm UUID profile IDs and inspect `profiles.user_id` for incorrect/duplicate identity mappings. Confirm browser roles cannot gain ownership-write privileges through inherited roles or a privileged RPC.
3. Check for orphan session student IDs, unknown game slugs, null/out-of-range accuracy or streak, negative scores, and non-object/oversized metadata. `006` validates existing rows and stops transactionally on incompatible data. Reconcile records explicitly; do not fabricate missing observations.
4. Reconcile applied migration history, especially if the old `20260226` bootstrap ran before numbered migrations. Do not reapply changed historical migrations to live tables or blindly repair ledger entries. If `005` is already recorded, `006` is the forward upgrade; the `000` identity precondition still must be established.
5. Stop on any unexpected policies on game tables. Audit and replace them explicitly; permissive policies cannot simply be layered over with a new ownership policy.
6. Apply to a restored staging database, verify guard/ownership provisioning, run allow/deny tests using actual Supabase JWTs, and verify the real PostgREST RPC and reload flow. The local SQL auth shim is not a test of Supabase Auth or the REST gateway.
7. Require GitHub checks `Database security / migration-and-rls` and `Database security / client-persistence` through repository rules before merge. This patch adds jobs but does not change branch protection or deploy anything.

## Reproducible tests

Use disposable empty PostgreSQL databases only. `bootstrap.sql` is an auth test shim and must never be applied to Supabase production.

```sh
DATABASE_URL=postgresql://postgres:password@localhost/rk_test scripts/test-database.sh
DATABASE_URL=postgresql://postgres:password@localhost/rk_upgrade scripts/test-database.sh upgrade
npm ci --prefix tests/client
npm test --prefix tests/client
```

SQL tests cover fresh migrations, forward upgrade preservation, self/guardian access, cross-family isolation, null/anonymous identity, membership/ownership escalation, immutable session history, upsert/reset, foreign keys, numeric/metadata checks, and deletion cascades. Client tests render the actual page with mocked transport/navigation/audio and check child switching, cancellation of stale loads, failed saves, serialized saves, auth changes, and duplicate submissions.

## Client persistence

A selected student's state loads from the server after authentication and ownership checks. Missing progress starts at zero. Student changes remount all game state; late responses and old timers cannot write another child's cache. Cache keys include login and student; the old global score is never imported. Writes are serialized and failures are visible. Guest practice uses a separate device-only key. The static HTML fallback remains guest/device-only; it does not persist student records online.

## Remaining whole-app blockers outside this PR

The repository has no root `package.json`, lockfile, Next configuration, or complete app shell, so no full frontend build/ESLint/application typecheck can be reproduced from it. The client test manifest is deliberately separate and does not claim to repair that missing application scaffold.

The existing messages and quarterly-report routes use a service-role client with caller-supplied identity and no visible authorization check. Such requests bypass RLS; do not expose those endpoints until authentication and per-student authorization are implemented. Existing educational tables/views and resource access need a separate complete policy audit. Passing this game's checks does not secure those routes or authorize payments/checkout.
