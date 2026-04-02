# Homeschool Hub Immediate Deep-Dive Plan

## Scope and Design Principles

This plan translates your three immediate priorities into implementation-ready workflows. It is designed to preserve Renaissance Kids' quality bar while keeping onboarding low-friction for excellent instructors.

**Operating principles**
- **Safety by default:** No instructor can be visible/bookable without passing required trust checks.
- **Progressive onboarding:** Collect only what is needed at each step; defer non-blocking fields.
- **Parent transparency:** Families should always see verification status, safety readiness, and reporting artifacts.
- **State-aware compliance:** Compliance tasks are dynamically shown by state and program type.

---

## Priority 1: Trust, Safety, and Regulatory Compliance

### 1) Background Check Workflows (Checkr-style + state-aware rules)

#### Recommended onboarding flow
1. Instructor account created (email + phone OTP + legal name).
2. Instructor completes consent disclosure and SSN/ID handoff in embedded check flow.
3. Platform sends screening package request based on service state(s):
   - Base package: SSN trace + sex offender registry + national criminal database.
   - Add-ons by state/county risk policy (county criminal, federal criminal, motor vehicle if transportation offered).
4. Instructor status becomes **"Pending Review"** (cannot receive bookings).
5. Webhook updates status in real time:
   - `clear` → eligible for activation if other trust items complete.
   - `consider` / `suspended` → internal trust queue for manual adjudication.
6. Recheck cadence:
   - Annual full recheck.
   - Continuous monitoring (if provider supports) for new offenses.

#### Product requirements
- **State rules engine**: Store package IDs and legal copy per state.
- **Adjudication playbook**: Internal matrix for what is disqualifying, conditionally reviewable, or acceptable.
- **Turnaround UX**: Show expected timeline and checklist progress bar to reduce drop-off.
- **Cost control**:
  - Default to base package for all.
  - Trigger incremental add-ons only when required by locale/program.
  - Use staged payment: platform fronts first check for "First 10," then cost-share model for broader marketplace.

#### Compliance controls
- Track consent timestamp, IP, disclosure version, and report ID.
- Keep adverse action workflow templates ready (pre-adverse notice, dispute window, final notice).
- Separate PII vault from general profile data.

---

### 2) Insurance Verification + Micro-policy Option

#### Verification portal requirements
- Instructor uploads COI (certificate of insurance) with:
  - Policy holder legal name matching account legal entity.
  - General liability limit threshold (e.g., $1M occurrence / $2M aggregate baseline).
  - Abuse/molestation endorsement for child-facing programs.
  - Effective/expiration dates with automated renewal reminders (30/14/3 days).
- Admin review queue with:
  - OCR extraction for key fields.
  - Mismatch flags (expired, name mismatch, insufficient limits, missing abuse coverage).

#### Partnership model for "Hub Instructor" micro-policies
- Build a referral or embedded quote flow with a child-service-friendly broker/carrier.
- Offer pre-filled application data from instructor profile to reduce form fatigue.
- Target monthly/annual micro-policy products scoped for independent educators.
- Add "insurance eligible" tag and quote CTA for instructors who fail verification.

#### Trust badge outcomes (parent-facing)
- "Insurance Verified" with expiration date.
- "Coverage Pending" when expiring soon or under review.
- "Not Insured via Hub Standard" hidden from marketplace search unless family explicitly opts in (not recommended for launch).

---

### 3) Safety Protocols for In-person Pods

#### Digital waiver stack
- Parent signs:
  - Liability waiver.
  - Photo/media release.
  - Medical treatment authorization.
  - Behavior and pickup policy acknowledgement.
- Version all documents and bind signature to version hash + timestamp.

#### Emergency contact and health capture
- Required fields:
  - Primary/secondary emergency contacts.
  - Allergy/medical alerts.
  - Authorized pickup list with relationship + optional photo.
- Display a "quick safety card" view for instructors on mobile check-in.

#### Pick-up / drop-off digital sign-out
- Check-in:
  - Parent/guardian QR or PIN + geo/time stamp.
- Check-out:
  - Verify authorized pickup name (and optional photo match).
  - Capture signature and reason if non-standard pickup.
- Escalation:
  - One-tap "guardian not authorized" protocol with audit trail and alert to admin.

#### Incident readiness
- In-app incident report form with severity level + witness notes + photo upload.
- Auto-notify admin and retain immutable timeline.
- Post-incident follow-up tasks and closure status.

---

## Priority 2: Instructor Onboarding & Vetting

### 1) Profile Verification Framework

#### Vetting stages (gated)
1. **Identity & Contact**: legal name, address, phone verification.
2. **Background Cleared**: completed screening status.
3. **Credentials Verification**:
   - Degree/certification uploads.
   - Manual verification for first cohort; automate later.
4. **Experience Review**:
   - Resume + portfolio + teaching sample (video or lesson artifact).
   - Reference checks (minimum 2, at least 1 parent/family reference if available).
5. **Philosophy Fit**:
   - Short structured questionnaire on arts-integrated pedagogy.
   - Rubric scored by academic lead.
6. **Safety Readiness**:
   - Insurance verified.
   - Waiver/check-in protocol training complete.

#### Rubric dimensions (score 1-5)
- Pedagogical skill.
- Classroom management/safety mindset.
- Subject competence (math/science/language integration).
- Communication professionalism.
- Family alignment and warmth.

Require minimum composite threshold for listing activation.

---

### 2) Initial Micro-credentialing System (first 5 badges)

Launch with clear, high-signal badges:
1. **Background Cleared**
   - Issued when current background check is cleared and in-date.
2. **Verified Arts-Integrated Educator**
   - Issued after lesson-plan review demonstrates arts + academics integration.
3. **STEM Teaching Verified**
   - Issued when instructor demonstrates grade-appropriate STEM instruction competency.
4. **Special Needs Accessible (Level 1)**
   - Issued for completion of accessibility/accommodation training + sample adaptation artifact.
5. **Safety Protocol Certified**
   - Issued when instructor completes pod safety workflow simulation (waiver, incident, pickup protocol).

Badge governance:
- Badge criteria published publicly.
- Expiration/revalidation rules (12-24 months depending on badge).
- Evidence artifacts retained for audit.

---

### 3) "First 10" Star Instructor Strategy

#### Cohort composition targets
- 3 arts-primary educators with strong literacy integration.
- 3 STEM-primary educators with hands-on project pedagogy.
- 2 special education / neurodiversity-support specialists.
- 2 cross-disciplinary master teachers with parent trust equity.

#### Sourcing channels
- Existing Renaissance Kids alumni instructors.
- Parent referrals with demonstrated outcomes.
- Local teacher networks and arts organizations.

#### Concierge onboarding model (4-week sprint)
- Week 1: trust checks + profile setup white-glove support.
- Week 2: lesson artifact review and badge pathway setup.
- Week 3: safety simulation + insurance completion.
- Week 4: launch readiness, listing optimization, and first booking push.

#### Success criteria for first 10
- 100% pass trust stack before launch.
- Average parent session rating >= 4.8/5 after first 20 sessions.
- >= 80% complete portfolio evidence uploads each month.
- >= 70% rebooking rate within first 60 days.

---

## Priority 3: Progress Portfolios & State Compliance

### 1) Built-in Documentation for State Standards (NYS first)

#### Data model essentials
- `LearningStandard` (state, subject, grade band, code, description).
- `SessionPlan` linked to selected standards.
- `StudentEvidence` (photo, artifact, note, assessment tag).
- `MasterySignal` (introduced/practiced/demonstrated).

#### Instructor workflow (low-friction)
1. Build or clone a class template.
2. Pre-tag standards once at template level.
3. During/after class, tap quick evidence chips (photo + note + standard check).
4. Auto-suggest standards from activity type to reduce manual tagging.

#### Quality controls
- Require at least one evidence item per standard claimed each reporting cycle.
- Flag over-tagging (too many standards for short sessions).
- Parent preview mode before export lock.

---

### 2) Exportable Quarterly Portfolios

#### Export formats
- **District submission report (PDF):** concise, standards-aligned narrative + attendance + evidence index.
- **Family showcase report (PDF):** visual, photo-forward highlights and growth reflections.
- **Data export (CSV/JSON):** standards mappings and session logs for advanced parent records.

#### Portfolio structure (quarterly)
- Cover page (student name, grade, term, instructor roster).
- Subject progress summary with standards references.
- Evidence gallery (captioned photos/work samples).
- Skills growth narrative and next-quarter goals.
- Attendance and instructional hours summary.

#### Compliance operations
- NY-first rules pack with district-agnostic defaults and override support.
- Parent/legal guardian e-sign acknowledgment before submission export.
- Immutable archive of exported reports and source evidence for audits.

---

## 90-Day Execution Plan

### Days 1-30 (Foundation)
- Implement trust stack schema and status engine.
- Integrate background check provider in sandbox + webhook handling.
- Launch insurance upload/review queue MVP.
- Define first five badges and rubric scoring cards.

### Days 31-60 (Pilot)
- Onboard First 10 with concierge process.
- Run safety protocol simulations and incident drill.
- Launch NY standards tagging alpha with 2-3 pilot instructors.
- Generate first portfolio exports and gather parent feedback.

### Days 61-90 (Scale Readiness)
- Automate reminder cadences (rechecks, insurance renewals, badge expirations).
- Add parent-facing trust badges to listing cards.
- Refine standards recommendation logic based on pilot usage.
- Publish launch playbook and KPI dashboard for marketplace expansion.

---

## KPI Dashboard (Launch-Critical)

### Trust & safety
- Background check completion rate.
- Median time to clear trust stack.
- Insurance verification pass rate.
- Safety incident rate per 1,000 student-hours.

### Instructor quality
- Vetting pass rate.
- Badge attainment distribution.
- Parent rating and qualitative trust sentiment.
- Rebooking rate and instructor retention.

### Compliance & portfolio usage
- Standards-tagging completion per session.
- Quarterly export completion rate.
- Parent satisfaction with report usefulness.
- District acceptance/no-revision rate (where tracked).

This sequence gives you a defensible safety/compliance foundation first, while still enabling a controlled growth path with high-quality instructors and parent-ready reporting.
