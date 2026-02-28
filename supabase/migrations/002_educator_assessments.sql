-- Migration: 002_educator_assessments
-- Purpose: Track assessments and progress monitoring in compliance with IHIP standards

CREATE TABLE educator_assessments (
    id SERIAL PRIMARY KEY,
    educator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('formal', 'informal', 'observation', 'portfolio', 'standardized')),
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    standards_addressed TEXT[],
    score_raw NUMERIC(6, 2),
    score_max NUMERIC(6, 2),
    score_percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE WHEN score_max > 0 THEN ROUND((score_raw / score_max) * 100, 2) ELSE NULL END
    ) STORED,
    mastery_determination VARCHAR(20) CHECK (mastery_determination IN ('below', 'approaching', 'meets', 'exceeds')),
    ihip_compliant BOOLEAN DEFAULT TRUE,
    notes TEXT,
    assessed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp
);

CREATE INDEX idx_educator_assessments_educator_id ON educator_assessments(educator_id);
CREATE INDEX idx_educator_assessments_student_id ON educator_assessments(student_id);
CREATE INDEX idx_educator_assessments_subject ON educator_assessments(subject, grade_level);
CREATE INDEX idx_educator_assessments_assessed_at ON educator_assessments(assessed_at);

CREATE TABLE assessment_skill_links (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES educator_assessments(id) ON DELETE CASCADE,
    student_skill_id INTEGER NOT NULL REFERENCES student_skills(id) ON DELETE CASCADE,
    UNIQUE (assessment_id, student_skill_id)
);
