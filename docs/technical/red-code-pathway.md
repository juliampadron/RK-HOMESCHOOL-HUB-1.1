# Red Code Pathway

This file captures the requested “Red code” handoff in a clean implementation pathway for the Renaissance Kids Homeschool Hub.

## 1) Worksheet Template Scaffold (YAML)

```yaml
# templates/[subject]/[topic]-[level].yaml
title: "[Descriptive Title]"
subject: [science/math/ela/arts]
gradeRange: [minimum_tag, maximum_tag]
estimatedTime: [minutes]
layout: [layout-file.hbs]

defaultData:
  studentName: "_________________"
  date: "_________________"
  includePredictions: true
  includeDrawings: true

sections:
  - title: "What's the Question?"
    content: "[Driving question]"

  - title: "Materials"
    content: |
      - [Material 1]
      - [Material 2]

  - title: "My Prediction"
    content: "I predict __________ because __________."
    condition: includePredictions

  - title: "Results"
    content: |
      | Trial | Observation |
      |-------|-------------|
      | 1     |             |
      | 2     |             |

  - title: "What I Discovered"
    content: "[Conclusion prompt]"
```

## 2) Student Progress Report Query (SQL)

```sql
SELECT w.*, t.content->>'title' AS template_title
FROM worksheets w
JOIN templates t ON w.template_id = t.id
WHERE w.user_id = [user_id]
  AND w.created_at BETWEEN [start_date] AND [end_date]
ORDER BY w.created_at DESC;
```

## 3) Science Safari Simulation Scaffold (TypeScript)

```typescript
'use client';

interface Props {
  level?: 'basic' | 'intermediate' | 'advanced';
  onComplete?: (result: any) => void;
}

export function Simulation({ level = 'basic', onComplete }: Props) {
  // 1) Render interaction UI at selected level
  // 2) Track user actions for progress analytics
  // 3) Call onComplete(result) when learner finishes
  return null;
}
```

## 4) AI Prompt Snippets

### 4.1 Leveled Worksheet

```text
Create a [subject] worksheet at the [tag] level about [topic].
Include: [specific requirements].
Format as YAML following Renaissance Kids template structure.
Make it printable on letter paper with age-appropriate spacing.
```

### 4.2 Assessment Questions

```text
Generate 5 multiple-choice questions at the [tag] level about [standard].
Include one application question.
Provide an answer key with explanations.
```

### 4.3 Arts Integration Planning

```text
Suggest an arts integration activity connecting [academic topic] to [art form] for [age range].
Include objectives, materials, procedure, and assessment.
Align with NYS standards.
```

## 5) Implementation Mapping in This Repo

- Solfege staircase pathway: `homeschool-hub/solfege-staircase/index.html`
- Worksheet template roots: `supabase/templates/`
- Reports API entrypoint: `src/app/api/reports/ihip/quarterly/route.ts`

Use this file as the **technical quick-start** companion to `README.md`.
