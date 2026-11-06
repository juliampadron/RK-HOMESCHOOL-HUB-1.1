-- Migration: 004_reports_storage
-- Purpose: Persist generated quarterly report metadata and storage path

CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    student_id UUID NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    UNIQUE (student_id, year, quarter)
);

CREATE INDEX IF NOT EXISTS idx_reports_student_period ON reports(student_id, year, quarter);
