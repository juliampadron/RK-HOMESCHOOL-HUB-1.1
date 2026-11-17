# Renaissance Kids merge-readiness checklist

Legend: **Ready** = verified in the reviewed PR; **Staging required** = must be proven in the real staging project; **Deferred** = intentionally outside the invitation-only beta; **Missing** = not found in the repository.

## Private beta: merge gate

| Area | Requirement | Status |
|---|---|---|
| Identity | UUID student identities and verified guardian links | Staging required |
| Identity | Current enrolled guardians are allow-listed | Staging required |
| Database | Migration 006 fresh-install and forward-upgrade checks | Ready in CI; staging required |
| Database | RLS blocks cross-family game/session access | Ready in database tests; staging required |
| Reports | Guardian can request only their linked student's report | Implemented in PR #36; staging required |
| Messages | Unsafe service-role route cannot expose/send messages | Ready: disabled for beta |
| Build | Next 14, TypeScript, Tailwind, shadcn-compatible scaffold | Ready in PR #36 |
| Build | Reviewed lockfile; typecheck, lint, and production build | Missing: root package-lock; run after it is added |
| Content | Science 3–5 schedule, capacity, lessons, and Drive links | Schedule/pricing recorded; capacity and links missing |
| Deployment | Staging environment secrets configured | Staging required |
| Beta safety | No checkout, payment wall, payment webhook, or payment secret | Ready by scope |

## Deferred until public enrollment

| Area | Requirement | Status |
|---|---|---|
| Payments | Square checkout and payment records | Deferred — Square selected; no beta payment integration |
| Payments | Square webhook signature verification and test-mode flow | Deferred |
| Enrollment | Enrollment-gated game unlocking | Deferred; beta access uses approved guardian/student relations |
| Checkr | Instructor webhook, verified signature, and admin review workflow | Deferred |
| Instructor | Instructor class management and upload interface | Missing / deferred |
| Admin | Approval dashboard, explicit admin role, audit trail | Missing / deferred |
| Legal | Privacy policy, terms of service, COPPA review | Deferred before public launch |
| Operations | Backups, monitoring, rate limits, CORS and production security headers | Deferred before public launch |
| Public launch | Domain/DNS, SSL, public game labels, public registration | Deferred |

## Architecture decision required before public launch

The target design calls for adult `profiles`, separate parent-owned `students`, roles, classes, enrollments, and enrollment-gated games. The repository currently uses a different in-progress model: student-like `profiles` plus `student_guardians`.

Do not merge an automatic data conversion. Select one canonical model after beta, export the actual schema and migration ledger, then create a dedicated migration with staging restoration and family-isolation tests.

## Staging sign-off record

Before moving the beta PR out of draft, record:

- [ ] Staging project URL and migration ledger reviewed
- [ ] Two guardian accounts and two students provisioned
- [ ] Each guardian linked only to their own student
- [ ] Invited guardian succeeds with real Supabase JWT
- [ ] Uninvited signed-in account is denied
- [ ] Cross-family game, session, and report requests are denied
- [ ] Messaging endpoint returns no message data
- [ ] `npm ci`, typecheck, lint, build, and database suites pass
- [ ] Staff has approved every beta Drive link and folder permission
