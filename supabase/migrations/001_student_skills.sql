-- Migration: 001_student_skills
-- Purpose: Track student skill mastery levels and alignments to NYS standards

CREATE TABLE student_skills (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    standard_code VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(10) NOT NULL,
    skill_name VARCHAR(255) NOT NULL,
    mastery_level VARCHAR(20) NOT NULL CHECK (mastery_level IN ('not_started', 'emerging', 'developing', 'proficient', 'advanced')),
    last_assessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp
);

CREATE INDEX idx_student_skills_student_id ON student_skills(student_id);
CREATE INDEX idx_student_skills_standard_code ON student_skills(standard_code);
CREATE INDEX idx_student_skills_subject ON student_skills(subject, grade_level);

CREATE TABLE skill_progress_history (
    id SERIAL PRIMARY KEY,
    student_skill_id INTEGER NOT NULL REFERENCES student_skills(id) ON DELETE CASCADE,
    previous_mastery_level VARCHAR(20),
    new_mastery_level VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT current_timestamp
);

CREATE INDEX idx_skill_progress_student_skill_id ON skill_progress_history(student_skill_id);
