# Copilot Instructions for RK-HOMESCHOOL-HUB-1.1

## Project Overview

**Renaissance Kids Homeschool Hub** is an educational platform serving homeschooling families with K–8 students. The platform provides interactive learning games, differentiated science and arts worksheets, instructor resource management tools, and a student progress dashboard.

Website: [renkids.org](https://www.renkids.org)  
Contact: (845) 452-4225

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (static) | Vanilla HTML5 + CSS + JavaScript (no framework) |
| Frontend (dynamic) | Next.js (TypeScript) — API routes under `app/api/` |
| Database | Supabase (PostgreSQL + Row-Level Security) |
| Auth | Supabase Auth |
| Payments | Square API |
| Hosting | Static pages served from `/public`; Next.js API routes deployed via SSH |
| CI/CD | GitHub Actions |

---

## Repository Structure

```
.github/
  copilot-instructions.md   ← this file
  GITHUB_SECRETS.md         ← required secrets for GitHub Actions
app/
  api/
    checkout/
      route.ts              ← Next.js API route for Square checkout
homeschool-hub/
  solfege-staircase/
    index.html              ← Playable music ear-training game (self-contained HTML)
supabase/
  migrations/               ← SQL migration files (Supabase CLI format)
  templates/                ← YAML/YML worksheet templates
science_investigation_templates/
                            ← Markdown investigation guides (differentiated by level)
bulk_upload_science_template.csv
                            ← CSV schema for bulk resource uploads
README.md                   ← Deployment guide and feature documentation
```

---

## Architecture Conventions

### Frontend (Static Games & Pages)
- Self-contained single-file HTML pages live under `homeschool-hub/<game-name>/index.html`.
- Use vanilla JS and the Web Audio API for interactive games — no bundler or framework.
- Persist player progress with `localStorage` using the key prefix `rk_`.
- CSS uses CSS custom properties (variables) defined in `:root` for the brand palette:
  - `--rk-green: #2F6B65`
  - `--rk-yellow: #FBC440`
  - `--rk-orange: #F05A22`
- All interactive elements must include ARIA labels and keyboard (`Enter`/`Space`) support.
- Each page must include a print stylesheet (`@media print`) that hides controls and renders a clean worksheet layout.

### API Routes (Next.js)
- API routes live under `app/api/<feature>/route.ts`.
- Use TypeScript for all Next.js code.
- Environment variables are read from `.env.local` locally and GitHub Secrets in CI.

### Database (Supabase)
- Migration files go in `supabase/migrations/` with the filename format `YYYYMMDD_description.sql`.
- RBAC roles: `guest`, `registered`, `verified_family`, `admin`.
- Always define Row-Level Security (RLS) policies when creating new tables.
- Reference `auth.users(id)` for user-linked data (UUID foreign keys).

### Worksheet & Template Files
- Worksheet templates use YAML (`.yml` or `.yaml`) under `supabase/templates/`.
- Differentiation levels must be labeled: `BELOW`, `STANDARD`, `ADVANCED`.
- Science investigation templates use Markdown under `science_investigation_templates/`.
- Grade groupings: Elementary (ages 5–9, Pre-K–5th) and Middle/Upper (ages 10–16, 6th–8th).

---

## Required GitHub Secrets

See `.github/GITHUB_SECRETS.md` for the full list. Key secrets:

| Secret | Purpose |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SQUARE_ACCESS_TOKEN` | Square production access token |
| `SQUARE_APP_ID` | Square app ID |
| `SQUARE_LOCATION_ID` | Square location ID |
| `SQUARE_WEBHOOK_SECRET` | Square webhook signing secret |
| `DEPLOY_KEY` | SSH private key for deployment |
| `DEPLOY_HOST` | Production server hostname |
| `DEPLOY_USER` | SSH username |

---

## Development Guidelines

### Adding a New Interactive Game
1. Create `homeschool-hub/<game-name>/index.html` as a self-contained HTML file.
2. Follow the brand styles (CSS variables, border-radius: 28px for containers, pill buttons).
3. Include a `localStorage` score/progress key prefixed with `rk_`.
4. Add OG/Twitter meta tags pointing to `https://www.renkids.org/homeschool-hub/<game-name>`.
5. Add a `@media print` stylesheet for worksheet conversion.
6. Ensure all interactive elements are keyboard-accessible with ARIA roles.

### Adding a New API Endpoint
1. Create `app/api/<feature>/route.ts`.
2. Export named HTTP method handlers (`GET`, `POST`, etc.) per Next.js App Router conventions.
3. Validate all inputs before processing.
4. Never hardcode secrets; always use `process.env`.

### Adding a Database Migration
1. Create `supabase/migrations/YYYYMMDD_<description>.sql`.
2. Include RBAC grants and RLS policies in the same migration file.
3. Test locally with `supabase db reset` before committing.

### Adding a Worksheet Template
1. Add YAML files to `supabase/templates/<subject>/` for structured templates.
2. Add Markdown files to `science_investigation_templates/` for investigation guides.
3. Always include all three differentiation levels: BELOW, STANDARD, ADVANCED.

---

## Code Style

- **HTML/CSS/JS**: 2-space indentation, single quotes for JS strings.
- **TypeScript**: Follow standard Next.js TypeScript conventions; no `any` types.
- **SQL**: Uppercase SQL keywords; lowercase table and column names with underscores.
- **YAML**: 2-space indentation; string values in quotes when they contain special characters.
- Do not add comments unless they explain non-obvious logic (existing games use section header comments like `// ====== SECTION ======`).

---

## Testing & Verification

There is no automated test suite yet. Verify changes manually:

1. **Games**: Open in a browser, confirm audio plays, steps respond correctly, score persists on refresh, and print layout is clean.
2. **API routes**: Test with `curl` or a REST client against the local Next.js dev server (`npm run dev`).
3. **Database migrations**: Run `supabase db reset` locally to verify migrations apply cleanly.
4. **Worksheets**: Review YAML/Markdown for correct level labels and age-appropriate content.
