# Contributing to the RK Homeschool Hub

Thanks for helping with the Renaissance Kids Homeschool Hub. This is a small,
invitation-only beta for enrolled families — please keep changes small, reviewed,
and safe for children's data.

## Local dev setup

Requires **Node.js ≥ 20.9.0**.

```bash
git clone https://github.com/juliampadron/RK-HOMESCHOOL-HUB-1.1.git
cd RK-HOMESCHOOL-HUB-1.1
cp .env.example .env.local   # fill in staging values only — never commit .env.local
npm ci
npm run dev
```

Use a **staging** Supabase project for local work. Never point local dev at
production, and never run migrations or test scripts against staging/production
data — `scripts/test-database.sh` requires a disposable, empty Postgres database
(set `DATABASE_URL` to it).

## Before opening a PR

```bash
npm ci
npm run typecheck
npm run lint
npm run build
node tests/client/persistence.mjs
npm run test:db   # disposable database only (see above)
```

All five must pass. If a check fails, include the failure log in the PR body and
propose a fix — do not silently work around it.

## Commit style

- Small, single-purpose commits with a clear message, e.g.
  `fix: point Solfege launch card at canonical route`.
- Conventional-prefix style (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).
- Never commit secrets, `.env` files, real guardian/student data, or credentials.
  If you suspect a secret was committed, stop and tell the maintainer immediately
  — do not commit a "fix" that leaves the value in history.

## PR process

1. Open an issue first for anything beyond a typo or a docs fix.
2. Keep the diff narrow. **Non-invasive docs/metadata/config changes only** for
   launch-prep PRs — do not bundle changes to `/app`, `/components`, `/lib`,
   `/supabase` migrations, or `.html` game files into a docs PR. Code fixes get
   their own PR.
3. Fill in the PR template: what changed, why, validation commands run, and the
   checklist (CI green, README quickstart verified, no new high/critical
   vulnerabilities, no secrets committed, RLS/migrations unaffected or explicitly
   reviewed).
4. PRs touching migrations, RLS policies, auth, or anything that reads/writes
   student data need maintainer review and a staging verification run per
   `docs/staging-verification.md` before merge.
5. Never merge your own PR, and never merge while CI is red.

## Data & privacy rules

- Student data is children's PII. Treat every row as sensitive: no real student
  names, emails, or scores in issues, PRs, screenshots, or commit messages — use
  the fixture IDs in `tests/database/` (`20000000-...` / `parent-A` / `parent-B`).
- Game scores are practice data, not grades. Never present them as mastery or
  assessment results.
- Quarterly-report work must follow the honesty rules in the repo docs: actual
  hours only, per-subject coverage with explanations, no invented credits, dates,
  or recipients; draft/blocked states instead of fabricated submissions.
- The beta allow-list (`RK_BETA_ALLOWED_EMAILS`) comes from the office's enrollment
  records only. Never add a family from a URL, a form submission, or a
  caller-supplied ID.
