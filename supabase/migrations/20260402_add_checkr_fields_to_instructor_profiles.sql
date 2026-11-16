-- Migration: Add Checkr background-check fields to instructor_profiles
-- Purpose: Track onboarding and adjudication details for compliance workflows

ALTER TABLE instructor_profiles
  ADD COLUMN IF NOT EXISTS checkr_candidate_id TEXT,
  ADD COLUMN IF NOT EXISTS checkr_report_id TEXT,
  ADD COLUMN IF NOT EXISTS checkr_status TEXT,
  ADD COLUMN IF NOT EXISTS checkr_adjudication TEXT,
  ADD COLUMN IF NOT EXISTS checkr_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS background_check_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS background_check_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_instructor_profiles_checkr_status
  ON instructor_profiles (checkr_status);

CREATE INDEX IF NOT EXISTS idx_instructor_profiles_background_check_verified
  ON instructor_profiles (background_check_verified);
