# Homeschool Hub Immediate Deep-Dive Plan (Architecture-Aligned)

This revision maps the three priority areas directly to the current platform architecture:
- **Frontend:** Next.js 14 + TypeScript + Tailwind + shadcn/ui
- **Backend:** Supabase + Stripe + Checkr + Vercel
- **Core data model:** `profiles`, `user_roles`, `students`, `instructor_profiles`, `classes`, `games`, `enrollments`, `payment_intents`
- **Security model:** RLS-first, service-role webhooks, append-only audit trails

---

## 1) Priority: Trust, Safety, and Regulatory Compliance

## 1.1 Background Checks (Checkr) Without High Friction

### Product flow (instructor onboarding)
1. Instructor completes account setup (`profiles` + `user_roles=instructor`).
2. Instructor profile is created in `instructor_profiles` with:
   - `background_check_status = 'not_started'`
   - `is_marketplace_approved = false`
3. Instructor starts Checkr consent flow from onboarding stepper.
4. Checkr webhook (`POST /api/webhooks/checkr`) updates status:
   - `pending` → `in_progress`
   - `clear` → `cleared`
   - `consider` / `suspended` → `manual_review`
5. Only when trust gates pass does admin set `is_marketplace_approved = true`.

### Data additions (Supabase)
Add these columns to `instructor_profiles`:
- `background_check_status text not null default 'not_started'`
- `background_check_completed_at timestamptz`
- `background_check_provider text default 'checkr'`
- `background_check_report_id text`
- `background_recheck_due_at timestamptz`

Add table:
- `background_check_events` (append-only)
  - `id uuid pk`
  - `instructor_profile_id`
  - `provider_event_id`
  - `old_status`, `new_status`
  - `payload jsonb`
  - `created_at`

### Cost + UX controls
- Use a **two-stage package policy**:
  - Stage A (default): lower-cost baseline checks.
  - Stage B (conditional): state/county add-ons only when required.
- For “First 10” instructors: platform-subsidized checks.
- For general marketplace: pass-through or partial subsidy.

### RLS and security
- Parents can only read a derived public trust badge, never raw check details.
- Only admin/service role can read provider payloads.
- Webhook route verifies Checkr signature and writes audit logs.

---

## 1.2 Insurance Verification + Hub Micro-Policy

### Required fields on instructor profile
- `insurance_status text not null default 'not_submitted'`
- `insurance_carrier text`
- `policy_number_last4 text`
- `policy_effective_date date`
- `policy_expiration_date date`
- `gl_coverage_per_occurrence numeric`
- `gl_coverage_aggregate numeric`
- `abuse_coverage_verified boolean default false`

### Supporting tables
- `insurance_documents`
  - file path in Supabase Storage
  - review status (`pending`, `approved`, `rejected`)
  - reviewer + timestamp
- `insurance_verification_events` (append-only)

### Workflow
1. Instructor uploads COI in onboarding.
2. Admin review queue validates limits + abuse coverage.
3. Approved insurance updates `insurance_status='verified'`.
4. Renewal automation triggers notifications at 30/14/3 days pre-expiry.
5. Expired policies auto-downgrade instructor visibility in search.

### Micro-policy partnership path
- Add “Get insured” CTA in onboarding when status is rejected/missing.
- Pre-fill partner form fields from profile to lower drop-off.
- Track quote starts and bind conversions in `insurance_partner_referrals`.

---

## 1.3 Pod Safety Protocols (Waivers, Emergency Contacts, Pickup)

### Parent/student data model
- `students`
  - `medical_notes text`
  - `allergies text`
- `student_emergency_contacts`
- `student_pickup_authorizations`

### Operational tables
- `waiver_templates` (versioned)
- `waiver_signatures`
- `attendance_events` (`check_in`, `check_out`)
- `safety_incidents` (append-only with severity)

### UX flow
- During enrollment checkout completion, require waiver signature before class start.
- Instructor class roster includes “Safety Card” quick view (contacts + allergies + pickup list).
- Check-out requires authorized guardian confirmation and signature/PIN.

### RLS
- Parents: access only their own students + signatures.
- Instructors: access safety info only for actively enrolled students.
- District viewers: read-only to compliant report views only.

---

## 2) Priority: Instructor Onboarding & Vetting

## 2.1 Gated Onboarding Pipeline

Implement onboarding stages in `instructor_profiles.onboarding_stage`:
1. `profile_started`
2. `identity_verified`
3. `background_cleared`
4. `credentials_reviewed`
5. `safety_certified`
6. `approved`

Add quality score fields:
- `vetting_score numeric`
- `vetting_notes text`
- `reviewed_by uuid`
- `reviewed_at timestamptz`

### Reviewer rubric (stored in `instructor_review_scores`)
- Pedagogy quality
- Arts-academics integration
- Classroom safety readiness
- Communication and family trust
- Experience and reliability

Activation rule:
- `is_marketplace_approved=true` only when all hard gates are passed and score threshold is met.

---

## 2.2 First 5 Micro-Credentials

Create tables:
- `credential_definitions`
- `instructor_credentials`
- `credential_evidence`

Initial credential set:
1. `background_cleared`
2. `verified_arts_integrated_educator`
3. `stem_teaching_verified`
4. `special_needs_accessible_l1`
5. `safety_protocol_certified`

Each credential includes:
- Criteria JSON
- Issued date / expiry date
- Verifier metadata
- Evidence links

Display these as shadcn badge components on public instructor cards.

---

## 2.3 “First 10” Instructor Launch Program

### Selection targets
- 3 arts-led + literacy integrated
- 3 STEM-led
- 2 special-needs experienced
- 2 cross-disciplinary anchors

### 4-week execution
- Week 1: trust stack + profile completion
- Week 2: lesson artifact + credential scoring
- Week 3: safety protocol simulation + insurance completion
- Week 4: listing QA + first bookings + parent feedback loop

### KPI targets for cohort
- 100% trust stack completed pre-launch
- ≥4.8 average parent rating
- ≥70% rebooking in first 60 days
- <5% onboarding abandonment after consent

---

## 3) Priority: Progress Portfolios & State Compliance

## 3.1 NYS Standards-Aligned Documentation

### Core tables
- `learning_standards` (state, subject, grade_band, code)
- `class_standard_mappings`
- `student_evidence`
- `portfolio_entries`

### Instructor workflow in app
1. Instructor maps class template to standards once.
2. During/after class, instructor logs evidence (photo/work/note).
3. Evidence links to standards + student + class session.
4. Parent dashboard shows progress by standard mastery state.

### Quality controls
- Prevent “standards over-tagging” with validation rules.
- Require minimum evidence count per standard per quarter.
- Keep evidence immutable after quarterly export lock (with admin override event log).

---

## 3.2 Exportable Quarterly Portfolios

### Export products
- **District PDF:** standards-aligned summary + attendance + hours
- **Family PDF:** visual showcase + growth narrative
- **CSV/JSON:** machine-readable evidence and standards mapping

### Delivery architecture
- Next.js route handler generates export jobs.
- Supabase function/queue compiles artifacts.
- Files stored in Supabase Storage with signed URLs and expiry.
- Export event logged in `portfolio_export_events` for audit.

---

## 4) API and RLS Integration Checklist

## API routes
- `POST /api/checkout`
  - create `payment_intents`
  - return Stripe session URL
- `POST /api/webhooks/stripe`
  - verify signature
  - mark payment success
  - create `enrollments`
- `POST /api/webhooks/checkr`
  - verify signature
  - update `instructor_profiles.background_check_status`
  - insert `background_check_events`

## RLS enforcement points
- Parents only see their own `students` + related records.
- Instructors only see enrolled students and class-linked evidence.
- Games unlock from active `enrollments` only.
- Audit/event tables are append-only.
- District viewers are read-only via limited views.

Use helper function in policies:
```sql
create function has_role(text) returns boolean;
```

---

## 5) 90-Day Technical Delivery Plan

### Days 1-30 (Schema + Security)
- Ship migrations for trust, insurance, safety, credentials, standards tables.
- Add/verify RLS policies + role checks.
- Implement Checkr + Stripe webhook hardening and audit logging.

### Days 31-60 (Pilot Features)
- Launch instructor onboarding stepper with trust gates.
- Launch admin review queues for checks/insurance/credentials.
- Pilot standards tagging + quarterly export with first 10 instructors.

### Days 61-90 (Scale + Reliability)
- Add reminder automation (recheck, renewal, credential expiry).
- Add analytics dashboards for trust and portfolio completion.
- Load/perf test webhook and export pipelines before broad launch.

---

## 6) Launch-Critical Metrics (Dashboard)

### Trust & Safety
- Median time from signup to `background_cleared`
- Insurance verification pass rate
- Safety incidents per 1,000 student-hours

### Instructor Quality
- Vetting pass rate
- Credential completion rate by badge
- Parent rating and rebooking rates

### Compliance Reporting
- Standards-tagged session rate
- Quarterly export completion rate
- District acceptance/no-revision rate

This plan is now directly implementable against the current Next.js + Supabase architecture and RLS security model.
