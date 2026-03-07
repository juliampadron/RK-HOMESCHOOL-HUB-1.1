-- Add tables for API functionality
-- This migration adds the tables needed for classes, enrollments, payments, games, and progress tracking

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL,
    instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_area VARCHAR(50),
    grade_band VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'full')),
    max_students INTEGER,
    current_enrollment INTEGER DEFAULT 0,
    schedule JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instructor profiles table
CREATE TABLE IF NOT EXISTS instructor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    background_check_status VARCHAR(20) DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'clear', 'consider', 'failed')),
    checkr_candidate_id VARCHAR(255),
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment intents table
CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_session_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    payment_intent_id UUID REFERENCES payment_intents(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
    hours_completed DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, class_id)
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    html_content TEXT NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student progress table
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    activity_type VARCHAR(50),
    hours_logged DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio items table
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit trail table
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_instructor ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_subject_grade ON classes(subject_area, grade_band);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_user ON instructor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_student ON payment_intents(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_class ON payment_intents(class_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_stripe_session ON payment_intents(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_games_class ON games(class_id);
CREATE INDEX IF NOT EXISTS idx_games_public ON games(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_enrollment ON student_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_student ON portfolio_items(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);

-- Enable Row Level Security (RLS)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
CREATE POLICY "Public can view active classes from approved instructors"
    ON classes FOR SELECT
    USING (
        status = 'active' AND
        EXISTS (
            SELECT 1 FROM instructor_profiles ip
            WHERE ip.user_id = classes.instructor_id
            AND ip.approved = TRUE
        )
    );

CREATE POLICY "Instructors can manage their own classes"
    ON classes FOR ALL
    USING (auth.uid() = instructor_id);

-- RLS Policies for instructor_profiles
CREATE POLICY "Public can view approved instructor profiles"
    ON instructor_profiles FOR SELECT
    USING (approved = TRUE);

CREATE POLICY "Instructors can view and update their own profile"
    ON instructor_profiles FOR ALL
    USING (auth.uid() = user_id);

-- RLS Policies for students
CREATE POLICY "Parents can manage their own students"
    ON students FOR ALL
    USING (auth.uid() = parent_id);

-- RLS Policies for payment_intents
CREATE POLICY "Users can view their own payment intents"
    ON payment_intents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = payment_intents.student_id
            AND s.parent_id = auth.uid()
        )
    );

-- RLS Policies for enrollments
CREATE POLICY "Parents can view their students' enrollments"
    ON enrollments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = enrollments.student_id
            AND s.parent_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can view enrollments for their classes"
    ON enrollments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM classes c
            WHERE c.id = enrollments.class_id
            AND c.instructor_id = auth.uid()
        )
    );

-- RLS Policies for games
CREATE POLICY "Public can view public games"
    ON games FOR SELECT
    USING (is_public = TRUE);

CREATE POLICY "Enrolled students can view class games"
    ON games FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN students s ON e.student_id = s.id
            WHERE e.class_id = games.class_id
            AND s.parent_id = auth.uid()
            AND e.status = 'active'
        )
    );

CREATE POLICY "Instructors can manage their own games"
    ON games FOR ALL
    USING (auth.uid() = instructor_id);

-- RLS Policies for student_progress
CREATE POLICY "Parents can view their students' progress"
    ON student_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_progress.student_id
            AND s.parent_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can view progress for their classes"
    ON student_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN classes c ON e.id = student_progress.enrollment_id
            WHERE c.instructor_id = auth.uid()
        )
    );

-- RLS Policies for portfolio_items
CREATE POLICY "Parents can manage their students' portfolio"
    ON portfolio_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = portfolio_items.student_id
            AND s.parent_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can view portfolio for their classes"
    ON portfolio_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN classes c ON e.id = portfolio_items.enrollment_id
            WHERE c.instructor_id = auth.uid()
        )
    );

-- RLS Policies for audit_trail
CREATE POLICY "Only admins can view audit trail"
    ON audit_trail FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.username = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instructor_profiles_updated_at BEFORE UPDATE ON instructor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON student_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
