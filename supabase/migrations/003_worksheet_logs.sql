-- Migration: 003_worksheet_logs
-- Purpose: Log generated worksheets and capture students' completion trends for analytics

CREATE TABLE worksheet_logs (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    educator_id UUID REFERENCES profiles(id),
    template_id VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(10) NOT NULL,
    difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN ('below', 'standard', 'advanced')),
    standards_covered TEXT[],
    generated_at TIMESTAMP DEFAULT current_timestamp,
    assigned_at TIMESTAMP,
    due_at TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'assigned', 'in_progress', 'completed', 'reviewed')),
    score_percentage NUMERIC(5, 2),
    time_spent_minutes INTEGER,
    notes TEXT
);

CREATE INDEX idx_worksheet_logs_student_id ON worksheet_logs(student_id);
CREATE INDEX idx_worksheet_logs_educator_id ON worksheet_logs(educator_id);
CREATE INDEX idx_worksheet_logs_subject ON worksheet_logs(subject, grade_level);
CREATE INDEX idx_worksheet_logs_status ON worksheet_logs(status);
CREATE INDEX idx_worksheet_logs_generated_at ON worksheet_logs(generated_at);

CREATE VIEW worksheet_completion_trends AS
SELECT
    student_id,
    subject,
    grade_level,
    difficulty_level,
    COUNT(*) AS total_assigned,
    COUNT(completed_at) AS total_completed,
    ROUND(AVG(score_percentage), 2) AS avg_score,
    ROUND(AVG(time_spent_minutes), 0) AS avg_time_minutes,
    MAX(completed_at) AS last_completed_at
FROM worksheet_logs
WHERE status IN ('completed', 'reviewed')
GROUP BY student_id, subject, grade_level, difficulty_level;
