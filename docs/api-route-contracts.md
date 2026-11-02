# API route contracts

## Private-beta policy

The beta supports approved current families only. There is no public registration, payment wall, checkout, payment provider credential, or payment webhook.

| Route | Beta state | Notes |
|---|---|---|
| `POST /api/checkout` | Not implemented | Deferred until the Square public-enrollment release |
| `POST /api/webhooks/square` | Not implemented | Deferred; must verify Square signature before any database write |
| `POST /api/webhooks/checkr` | Not implemented | Deferred; instructor onboarding is not beta scope |
| `GET /api/classes` | Not implemented | Class information is published through approved beta materials/Drive index |
| `GET /api/student/:studentId/progress` | Not implemented | Use the restricted quarterly-report endpoint after staging verification |
| `POST /api/games` | Not implemented | Do not accept or execute instructor-provided HTML in beta |
| `GET/POST /api/messages/send` | Disabled | Returns 503; the previous service-role implementation was unsafe |
| `GET /api/reports/ihip/quarterly` | Implemented in PR #36 | Requires a real Supabase JWT, beta invitation, and verified guardian/student relation |

## Future public-enrollment contract: Square

### POST /api/checkout

Creates a Square checkout/payment link for one class and one student.

Request:
```ts
{ classId: string; studentId: string }
```

Success:
```ts
{ url: string }
```

Requirements before implementation:

- Caller authenticated as the student’s parent/guardian.
- Class active, available, and within capacity.
- Server creates a pending payment record before calling Square.
- Idempotency key ties one request to one payment attempt.
- No client-supplied price, currency, parent ID, or enrollment status is trusted.
- Error responses are generic; provider details are logged server-side only.

### POST /api/webhooks/square

Processes only verified Square webhook events.

Process:

1. Verify Square’s webhook signature against the raw request body.
2. Locate the pending payment record by the stored provider reference.
3. Transactionally mark payment succeeded and create/activate exactly one enrollment.
4. Append an audit record.
5. Treat duplicate delivery as a successful no-op.

Never use a service-role credential in a browser. Webhook-only service access must be limited to this server route.

## Future instructor controls

### POST /api/webhooks/checkr

Deferred. Before release, verify a signed event, match the instructor by a server-stored candidate ID, update only an allowed status transition, append an audit event, and notify an admin for `consider`. An instructor must never approve their own background-check status.

### POST /api/games

Deferred. Do not store or render arbitrary `html_content`. Use reviewed, versioned game packages or a constrained content model; untrusted HTML could expose every family to script injection.

## Current report endpoint

### GET /api/reports/ihip/quarterly

Query: `student_id`, `year`, `quarter`, optional `format=json|pdf`.

A request succeeds only when the bearer token belongs to an allow-listed beta user who is the student or a verified guardian. Reports are private/no-store and do not reveal raw database errors.
