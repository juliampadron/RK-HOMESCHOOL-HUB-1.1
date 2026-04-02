# Renaissance Kids Homeschool Hub

Comprehensive Program Operations Guide & Technical Handoff (v2.0)

- **Document type:** Program Operations Manual + Technical Specification
- **Audience:** Program Directors, Educators, Technical Team, AI Assistants
- **Version:** 2.0
- **Date:** February 26, 2026
- **Owner:** Renaissance Kids Leadership Team

## Executive Summary

Renaissance Kids Homeschool Hub integrates two age-specific tracks with NYS standards-aligned academics and arts integration:

- **Elementary Program (Ages 5–9):** Foundation and discovery through play.
- **Middle/Upper Program (Ages 10–16):** Mastery, analytical thinking, and project-based rigor.

The platform combines:

- Worksheet generation (Writing Room)
- Interactive science simulations (Science Safari)
- Student progress dashboards
- Quarterly reporting and portfolio support

> Core philosophy: **“Learning is lit up through the arts.”**

---

## 1) Program Architecture Overview

### 1.1 Age-Based Structure

| Program | Goal | Class Format | Instructional Approach | Assessment |
|---|---|---|---|---|
| Ages 5–9 | Foundation + discovery through play | 90-minute integrated blocks | Games, hands-on exploration, arts integration | Observation checklists + portfolios |
| Ages 10–16 | Mastery + analytical thinking | 2-hour immersion blocks | Formal method, lab reports, digital media production | Rubrics, reports, quarterly tracking |

### 1.2 NYS Standards Alignment

- **ELA:** Foundational literacy (K–3) to literary analysis and research (4–8)
- **Math:** Counting/place value (K–3) to algebra readiness/functions (4–8)
- **Science:** Foundational exploration (K–3) to formal scientific method + lab reporting (4–8)
- **Arts Integration:** Movement, music, and visual art through digital media and performance

---

## 2) Elementary Program (Ages 5–9)

### 2.1 90-Minute Block

- **0:00–0:30** Literacy circle (phonics, read-aloud, comprehension)
- **0:30–0:45** Rotating stations (handwriting, spelling, independent reading)
- **0:45–1:15** Math explorations (manipulatives and fact fluency)
- **1:15–1:30** Closing circle (share-out + preview)

### 2.2 Science Quarterly Themes

- **Fall:** Life science
- **Winter:** Physical science
- **Spring:** Earth science
- **Summer:** Aerospace/space

Sample lab: **Push and Pull** (`K-PS2-1`, `K-PS2-2`) with predict → test → record → discuss workflow.

---

## 3) Middle & Upper Program (Ages 10–16)

### 3.1 2-Hour Block

- **0:00–0:45** Language arts intensive
- **0:45–1:30** Mathematics workshop
- **1:30–2:00** Cross-curricular application

### 3.2 Scientific Method + Formal Lab Reports

Student workflow:
1. Observation
2. Research
3. Hypothesis
4. Experiment
5. Data analysis
6. Conclusion

Lab reports use a consistent structure: Introduction, Methods, Results, Discussion, References.

---

## 4) Cross-Program Compliance & Operations

### 4.1 Tagging System

Student skill profiles use tags (e.g., `[3RD-ADVANCED]`, `[2ND-STANDARD]`) per subject and drive:

- Worksheet leveling
- Grouping decisions
- Progress reporting

### 4.2 IHIP and Quarterly Documentation

Each quarter includes:
- Instructional hours by subject
- Standards addressed
- Work samples + assessments
- Next-quarter goals

### 4.3 Daily Staff Operations

**Before class:** review tags, prep worksheets/materials, stage simulations.

**During class:** attendance, instructional logging, subgroup support, observation capture.

**After class:** progress updates, portfolio filing, inventory checks, next-week generation.

---

## 5) Technical Platform

### 5.1 Writing Room (Worksheet Generation)

Template-driven worksheet generation is powered by YAML templates under `supabase/templates`.

Example pathways in this repository:

- `supabase/templates/science/elementary/forces/push-pull-basics.yaml`
- `supabase/templates/elementary_science/forces_ramps_motion.yml`
- `supabase/templates/mathematics/elementary/fractions-geometry-basics.yaml`

### 5.2 Science Safari (Interactive Simulations)

Supports interactive concept exploration before and during hands-on labs:

- Forces and friction
- Static electricity
- Light waves
- Gravity challenge modes

### 5.3 Solfege Staircase (“Sôul fetched staircase” pathway)

The interactive Solfege Staircase experience is maintained at:

- `homeschool-hub/solfege-staircase/index.html`

This README now references the staircase file directly instead of embedding large raw HTML.

---

## 6) Red Code Pathway (New)

The requested **Red code** implementation has been moved into a dedicated technical handoff file:

- `docs/technical/red-code-pathway.md`

This new file contains:
- YAML worksheet template scaffolds
- SQL report query scaffold
- TypeScript simulation component scaffold
- Prompt templates for AI-assisted content generation

---

## 7) Implementation Roadmap (High Level)

### Phase 1 (Months 1–2)
- Scheduling finalized
- Staff trained on tagging
- Student profiles initialized
- Core templates migrated

### Phase 2 (Months 3–4)
- Science Safari classroom integration
- Quarterly reports launched
- Family portfolio onboarding
- Claymation pilot launched

### Phase 3 (Months 5–6)
- Data-informed tag validation
- Template prompt optimization
- Family science night
- Summer intensives publication

---

## Repository Notes

- This repository is the working implementation surface for program operations and technical delivery.
- Use this README as the operational index.
- Use `docs/technical/red-code-pathway.md` for implementation scaffolds and AI handoff prompts.
