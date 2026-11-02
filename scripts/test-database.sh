#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL to a disposable empty PostgreSQL database}"
cd "$(dirname "$0")/.."
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f tests/database/bootstrap.sql
if [[ "${1:-fresh}" == upgrade ]]; then
  for version in 000 001 002 003 20260226; do
    for migration in supabase/migrations/"$version"_*.sql; do
      psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$migration"
    done
  done
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f tests/database/fixtures/pr34_original_005.sql
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f tests/database/fixtures/legacy-data.sql
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/006_game_persistence_security.sql
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f tests/database/upgrade-assertions.sql
else
  for migration in supabase/migrations/*.sql; do
    psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$migration"
  done
fi
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f tests/database/rls.sql
