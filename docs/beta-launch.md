# Private beta launch

This is an invitation-only beta for fewer than ten currently enrolled Renaissance Kids families. It is not public registration, payment collection, or a replacement for the existing office billing process.

## Included

- Authenticated access for approved guardian accounts only.
- Guardian-to-student links established by trusted staff in `student_guardians`.
- Solfege Staircase practice progress. Scores are practice data, not grades or mastery.
- Guardian-authorized quarterly report generation, once the staging checks pass.

## Explicitly excluded

- Checkout, payment intents, webhooks, and entitlement automation.
- New account self-service enrollment.
- Family messaging. The prior endpoint is disabled because it was unsafe.
- Public indexing. The app layout requests no indexing.

## Beta access procedure

1. Use the office's current enrollment records as the source of truth. Do not add a family based on a URL, a form submission, or a caller-supplied ID.
2. Invite each guardian through Supabase Auth, verify their email, and add the lowercase email to `RK_BETA_ALLOWED_EMAILS`.
3. Create or verify a UUID row in `profiles` for each student.
4. With an administrator-only database connection, insert the reviewed `(student_id, guardian_user_id)` pair in `student_guardians`.
5. In staging, sign in as each guardian and prove that they can open only their own student's game and report.
6. Keep `RK_BETA_MODE=true`. Remove the beta only in a separate, reviewed release.

Never put the service-role key in a browser, email, Drive document, or client-side environment variable.
