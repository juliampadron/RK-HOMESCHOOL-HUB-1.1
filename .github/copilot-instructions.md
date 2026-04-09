# Copilot Instructions for RK-HOMESCHOOL-HUB-1.1

## Repository snapshot
- Static learning experiences live under `homeschool-hub/solfege-staircase/index.html`; keep it lightweight and browser-only (no build step).
- Supabase assets: schema starter in `supabase/migrations/20260226_init_hub.sql` and worksheet templates in `supabase/templates/**`. Treat these as source of truth for data structures/content scaffolding.
- Early API surface sits at `app/api/checkout/route.ts`; prefer TypeScript route handlers that stay minimal and dependency-free.
- Planning/reference notes are stored in `*.txt` files at the repo root.

## Development expectations
- There is no package manager or build tooling here. Favor plain HTML/CSS/JS (or minimal TypeScript) and avoid adding new dependencies or frameworks unless absolutely required.
- When updating Supabase SQL, preserve the defined roles (`guest`, `registered`, `verified_family`, `admin`) and keep row-level security tight. Add migrations instead of editing existing ones when possible.
- Follow the structure of existing templates when adding new YAML or markdown in `supabase/templates/**`.
- Keep changes scoped and well-described; do not touch unrelated files.

## Secrets and configuration
- Never hardcode credentials. Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and Square tokens (`SQUARE_ACCESS_TOKEN`, `SQUARE_APP_ID`, `SQUARE_LOCATION_ID`, `SQUARE_WEBHOOK_SECRET`) must stay in GitHub Secrets as documented in `.github/GITHUB_SECRETS.md`.
- If you need config values, use environment variables and document placeholders; do not commit `.env` files or generated artifacts.

## Testing and validation
- No automated tests are configured. After changes, manually verify:
  - Static pages load and interactive elements respond (`homeschool-hub/solfege-staircase/index.html` opened in a browser).
  - SQL/YAML changes parse cleanly and respect role permissions.
  - Any new API logic in `app/api` handles errors and returns clear responses.
- Keep verification notes in PR descriptions when manual steps are required.

## Delivery checklist
- Keep diffs small, readable, and ASCII-only; add concise comments only where behavior is non-obvious.
- Update related docs/templates when adjusting behavior.
- Default to least-privilege data access; avoid expanding RLS or secret exposure without explicit requirements.
