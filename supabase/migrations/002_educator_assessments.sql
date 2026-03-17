-- Migration: 002_educator_assessments.sql
-- Purpose: Track educator-created assessments and student results

CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    educator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20) NOT NULL,
    standard_codes TEXT[],
    description TEXT,
    max_score NUMERIC(5, 2) NOT NULL DEFAULT 100,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp
);

CREATE INDEX idx_assessments_educator_id ON assessments(educator_id);
CREATE INDEX idx_assessments_subject ON assessments(subject);
CREATE INDEX idx_assessments_grade_level ON assessments(grade_level);

CREATE TABLE assessment_results (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) CHECK (score >= 0),
    skill_level VARCHAR(20) CHECK (skill_level IN ('BELOW', 'STANDARD', 'ADVANCED')),
    feedback TEXT,
    submitted_at TIMESTAMP DEFAULT current_timestamp,
    graded_at TIMESTAMP,
    graded_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_assessment_results_assessment_id ON assessment_results(assessment_id);
CREATE INDEX idx_assessment_results_student_id ON assessment_results(student_id);

-- Enforce one result per student per assessment
ALTER TABLE assessment_results
    ADD CONSTRAINT uq_assessment_student UNIQUE (assessment_id, student_id);
