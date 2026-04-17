-- Migration: Add quarterly report tables
-- Date: 2026-03-07

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_initial CHAR(1) NOT NULL,
    grade_band VARCHAR(50) NOT NULL,
    parent_guardian_name VARCHAR(255) NOT NULL,
    district VARCHAR(255) DEFAULT 'Pleasant Valley UFSD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- Instructors table
CREATE TABLE instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- Classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subject_area VARCHAR(100) NOT NULL, -- 'Mathematics', 'Science', 'English Language Arts', 'Visual Arts', 'Music'
    instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- Enrollments table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL DEFAULT current_date,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'withdrawn'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    UNIQUE(student_id, class_id)
);

-- Hours tracking table
CREATE TABLE hours_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours DECIMAL(4, 2) NOT NULL CHECK (hours > 0),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- Portfolio items table
CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'essay', 'lab_report', 'artwork', 'project'
    submitted_date DATE NOT NULL,
    nys_standard VARCHAR(50), -- e.g., 'RL.7.2', 'MS-ESS2-2'
    file_url TEXT,
    thumbnail_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- NYS Standards tracking
CREATE TABLE nys_standards_met (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    standard_code VARCHAR(50) NOT NULL, -- e.g., 'NY-7.NS.A.2'
    standard_description TEXT NOT NULL,
    subject_area VARCHAR(100) NOT NULL,
    quarter VARCHAR(10) NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4'
    year INTEGER NOT NULL,
    evidence_type VARCHAR(50), -- 'portfolio', 'assessment', 'observation'
    evidence_id UUID, -- Reference to portfolio_items or other evidence
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- Instructor feedback table
CREATE TABLE instructor_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
    quarter VARCHAR(10) NOT NULL,
    year INTEGER NOT NULL,
    feedback_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- Reports table (audit trail)
CREATE TABLE quarterly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    quarter VARCHAR(10) NOT NULL,
    year INTEGER NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    generated_date TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
    generated_by UUID REFERENCES auth.users(id),
    file_url TEXT NOT NULL, -- Supabase Storage URL
    total_hours DECIMAL(6, 2),
    classes_enrolled INTEGER,
    instructors_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- Game activity tracking (for portfolio inclusion)
CREATE TABLE game_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    game_name VARCHAR(100) NOT NULL, -- 'Fraction Quest', 'Solfege Staircase', etc.
    subject_area VARCHAR(100) NOT NULL,
    date_played DATE NOT NULL,
    duration_minutes INTEGER,
    score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp
);

-- Indexes for performance
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_hours_log_enrollment_id ON hours_log(enrollment_id);
CREATE INDEX idx_hours_log_date ON hours_log(date);
CREATE INDEX idx_portfolio_items_student_id ON portfolio_items(student_id);
CREATE INDEX idx_nys_standards_student_id ON nys_standards_met(student_id);
CREATE INDEX idx_quarterly_reports_student_id ON quarterly_reports(student_id);
CREATE INDEX idx_game_activity_student_id ON game_activity(student_id);

-- Row Level Security Policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hours_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nys_standards_met ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_activity ENABLE ROW LEVEL SECURITY;

-- Students can view their own data
CREATE POLICY "Students can view own data" ON students
    FOR SELECT USING (auth.uid() = user_id);

-- Parents can view their children's enrollments
CREATE POLICY "View own enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = enrollments.student_id
            AND students.user_id = auth.uid()
        )
    );

-- Parents can view their children's hours
CREATE POLICY "View own hours" ON hours_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN students s ON s.id = e.student_id
            WHERE e.id = hours_log.enrollment_id
            AND s.user_id = auth.uid()
        )
    );

-- Parents can view their children's portfolio
CREATE POLICY "View own portfolio" ON portfolio_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = portfolio_items.student_id
            AND students.user_id = auth.uid()
        )
    );

-- Parents can view their children's standards
CREATE POLICY "View own standards" ON nys_standards_met
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = nys_standards_met.student_id
            AND students.user_id = auth.uid()
        )
    );

-- Parents can view their children's reports
CREATE POLICY "View own reports" ON quarterly_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = quarterly_reports.student_id
            AND students.user_id = auth.uid()
        )
    );

-- Parents can view their children's game activity
CREATE POLICY "View own game activity" ON game_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = game_activity.student_id
            AND students.user_id = auth.uid()
        )
    );

-- Admin policies (full access)
CREATE POLICY "Admin full access students" ON students
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.username = 'admin'
        )
    );

CREATE POLICY "Admin full access enrollments" ON enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.username = 'admin'
        )
    );
