## Summary

<!-- What this PR changes, and why, in a few sentences. -->

## Files changed

<!-- List the files, or paste the `git diff --stat` output. -->

## Audit / validation

<!-- Commands run and their results. For launch-prep PRs include the audit summary. -->

- [ ] `npm ci`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `node tests/client/persistence.mjs`
- [ ] `npm run test:db` (disposable database only — never staging/production)

## Release checklist

- [ ] CI green (if a workflow exists for this branch)
- [ ] README quickstart verified
- [ ] No new high/critical vulnerabilities (`npm audit` — paste the summary)
- [ ] License decision open/closed (note which)
- [ ] No secrets committed (no keys, tokens, or `.env` values in the diff)
- [ ] RLS / migrations confirmed present — or, if this PR touches them, staging verification per `docs/staging-verification.md` is done and linked

## Notes for the reviewer

<!-- Anything that needs a decision, or anything deliberately left out of this PR. -->
