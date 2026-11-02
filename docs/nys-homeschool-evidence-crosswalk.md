# NYS homeschool evidence crosswalk

This is a planning tool for Renaissance Kids families and staff. It helps organize evidence; it does not determine legal compliance, replace a parent’s IHIP, or submit records to a district. Confirm requirements and deadlines with each family’s district.

## Subject and evidence map

| Subject area | Learning evidence supported by the Hub | Suggested evidence |
|---|---|---|
| Mathematics | Math games; instructor-led classes | Game completion/activity log; uploaded worksheet |
| Science | STEM classes; hands-on projects | Lab report; dated experiment photo; observation/data table |
| Social studies | History classes; cultural arts | Essay; presentation; art project |
| English language arts | Literature; creative writing | Book report; writing sample |
| Visual arts | Painting; drawing; sculpture | Dated photo gallery; artist statement |
| Music | Solfege practice; instrument lessons | Performance video; composition; practice record |
| Physical education | Athletics; dance | Activity log; skill demonstration |

## Evidence rules

- A family owns and reviews its child’s evidence. The Hub should never label an activity as “compliant” automatically.
- Record the date, subject, instructor/material, and a brief progress note for every saved item.
- Store private student work in restricted Storage paths, not public Drive links.
- Keep an editable source separate from the parent-visible PDF/view-only copy.
- Game activity is supplementary practice evidence; it is not an authoritative grade or proof of mastery.

## Reporting support roadmap

| Capability | Beta | Public-launch requirement |
|---|---|---|
| View-only family materials | Included | Included |
| Worksheet and activity evidence | Manual staff/family upload only | Storage-backed, role-protected upload |
| Hours by subject | Not yet enabled | Enrollment/class-time model validated against the canonical schema |
| Quarterly PDF | Guardian-authorized report endpoint under staging test | Parent review, signature block, district-specific templates |
| Annual portfolio export | Deferred | Parent-selected evidence export and narrative summary |

## Data-model prerequisite

The proposed hours query assumes a separate `students` table with a parent owner, plus `enrollments` and time-bounded `classes`. Those tables are not confirmed in the current repository migration chain. Add the query only after the canonical parent/student/enrollment model is chosen and RLS-tested.

## Review calendar

Track the family’s IHIP, periodic reports, and annual assessment dates as parent/district-configured milestones. Do not hard-code one statewide calendar in the product: staff should confirm dates against current NYSED and district guidance before a family-facing reminder is sent.
