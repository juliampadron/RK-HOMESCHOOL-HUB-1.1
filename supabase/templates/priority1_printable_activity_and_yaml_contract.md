# Printable Activity Sheet Content Structure (Priority 1)

**TOP HEADER:** Renaissance Kids Logo + "Light up learning through the arts!™"

**TITLE:** `[e.g., The Science of Sound & Strings]`  
**AGE RANGE:** `[e.g., 5-9]`  
**ESTIMATED TIME:** `[e.g., 20 minutes]`

## Let's Explore!
`[1-2 brief sentences explaining the activity in an encouraging, jargon-free way.]`

## Materials Needed:
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

## Step-by-Step:
1. `[Clear, simple instruction]`
2. `[Clear, simple instruction]`
3. `[Clear, simple instruction]`

## Brain Challenge / Academic Connection:
`[A short prompt connecting the art/music activity to math, reading, or science]`

**FOOTER:** For more creative fun, visit www.renkids.org | (845) 452-4225

---

# YAML Template Contract

## Class Configuration Template

```yaml
class:
  id: uuid
  instructor_id: uuid
  title: string # required
  description: text
  price_cents: integer # required
  capacity: integer # default: 10
  status: enum['draft', 'active', 'full', 'cancelled']

  schedule:
    type: enum['one-time', 'recurring', 'flexible']
    start_date: date
    end_date: date
    days_of_week: array[enum['mon','tue','wed','thu','fri','sat','sun']]
    time_start: time
    time_end: time
    timezone: string # default: 'America/New_York'

  metadata:
    subject_area: enum['math', 'science', 'social_studies', 'ela', 'arts', 'music', 'pe']
    grade_band: enum['k-2', '3-5', '6-8', '9-12']
    nys_standards: array[string]
    materials_required: array[string]
    prerequisites: array[string]
```

## Example: Weekly Art Class

```yaml
class:
  title: "Watercolor Fundamentals"
  description: "Learn basic watercolor techniques through landscape painting"
  price_cents: 4500
  capacity: 8
  status: active

  schedule:
    type: recurring
    start_date: 2026-04-01
    end_date: 2026-06-30
    days_of_week: ['wed']
    time_start: '14:00'
    time_end: '15:30'
    timezone: 'America/New_York'

  metadata:
    subject_area: arts
    grade_band: '6-8'
    nys_standards: ['VA:Cr1.1', 'VA:Cr2.1']
    materials_required:
      - Watercolor paint set
      - Brushes (round #6, #10)
      - Watercolor paper (140lb)
    prerequisites: []
```

## Enrollment Template

```yaml
enrollment:
  id: uuid
  student_id: uuid # required
  class_id: uuid # required
  instructor_id: uuid # auto-populated
  payment_intent_id: uuid # auto-populated
  status: enum['pending', 'active', 'completed', 'cancelled']
  enrolled_at: timestamp

  attendance:
    sessions_attended: integer
    sessions_total: integer
    last_attended: date
```

## Game Upload Template

```yaml
game:
  title: string # required
  description: text
  class_id: uuid # required
  difficulty: enum['beginner', 'intermediate', 'advanced']
  is_public: boolean # default: false

  content:
    html: text # required
    thumbnail_url: string # optional

  metadata:
    subject_area: enum['math', 'science', 'music', 'arts']
    learning_objectives: array[string]
    estimated_duration_minutes: integer
```
