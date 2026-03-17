-- Migration: 003_worksheet_logs.sql
-- Purpose: Log student worksheet completions for progress tracking and IHIP reporting

CREATE TABLE worksheet_logs (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    worksheet_id VARCHAR(255) NOT NULL,
    worksheet_title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20) NOT NULL,
    standard_codes TEXT[],
    skill_level VARCHAR(20) NOT NULL CHECK (skill_level IN ('BELOW', 'STANDARD', 'ADVANCED')),
    score NUMERIC(5, 2) CHECK (score >= 0 AND score <= 100),
    time_spent_minutes INTEGER CHECK (time_spent_minutes >= 0),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT current_timestamp
);

CREATE INDEX idx_worksheet_logs_student_id ON worksheet_logs(student_id);
CREATE INDEX idx_worksheet_logs_subject ON worksheet_logs(subject);
CREATE INDEX idx_worksheet_logs_completed_at ON worksheet_logs(completed_at);
CREATE INDEX idx_worksheet_logs_standard_codes ON worksheet_logs USING GIN(standard_codes);

-- Aggregate view for quarterly IHIP reporting
CREATE VIEW student_quarterly_progress AS
SELECT
    student_id,
    subject,
    grade_level,
    DATE_TRUNC('quarter', completed_at) AS quarter,
    COUNT(*) AS worksheets_completed,
    ROUND(AVG(score), 2) AS avg_score,
    ROUND(AVG(time_spent_minutes), 0) AS avg_time_minutes
FROM worksheet_logs
WHERE completed = TRUE
GROUP BY student_id, subject, grade_level, DATE_TRUNC('quarter', completed_at);
