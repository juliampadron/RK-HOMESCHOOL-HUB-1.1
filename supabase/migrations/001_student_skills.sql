-- Migration: 001_student_skills.sql
-- Purpose: Track student skill progress aligned with NYS learning standards

CREATE TABLE student_skills (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20) NOT NULL,
    standard_code VARCHAR(50) NOT NULL,
    standard_description TEXT,
    skill_level VARCHAR(20) NOT NULL CHECK (skill_level IN ('BELOW', 'STANDARD', 'ADVANCED')),
    score NUMERIC(5, 2) CHECK (score >= 0 AND score <= 100),
    notes TEXT,
    assessed_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp
);

CREATE INDEX idx_student_skills_student_id ON student_skills(student_id);
CREATE INDEX idx_student_skills_standard_code ON student_skills(standard_code);
CREATE INDEX idx_student_skills_subject ON student_skills(subject);

-- Track skill progress history over time
CREATE TABLE student_skill_history (
    id SERIAL PRIMARY KEY,
    student_skill_id INTEGER NOT NULL REFERENCES student_skills(id) ON DELETE CASCADE,
    previous_skill_level VARCHAR(20),
    new_skill_level VARCHAR(20) NOT NULL,
    previous_score NUMERIC(5, 2),
    new_score NUMERIC(5, 2),
    changed_at TIMESTAMP DEFAULT current_timestamp,
    changed_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_skill_history_student_skill_id ON student_skill_history(student_skill_id);
