-- Sample data for testing quarterly report generation
-- Run this after the main migration to populate test data

-- Insert a test instructor
INSERT INTO instructors (id, name, email) VALUES
('11111111-1111-1111-1111-111111111111', 'M. Johnson', 'mjohnson@renkids.org'),
('22222222-2222-2222-2222-222222222222', 'Dr. Chen', 'chen@renkids.org'),
('33333333-3333-3333-3333-333333333333', 'S. Martinez', 'smartinez@renkids.org'),
('44444444-4444-4444-4444-444444444444', 'A. Wilson', 'awilson@renkids.org');

-- Insert test classes
INSERT INTO classes (id, title, subject_area, instructor_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pre-Algebra Fundamentals', 'Mathematics', '11111111-1111-1111-1111-111111111111'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Earth Science Lab', 'Science', '22222222-2222-2222-2222-222222222222'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Creative Writing Workshop', 'English Language Arts', '33333333-3333-3333-3333-333333333333'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Watercolor Fundamentals', 'Visual Arts', '44444444-4444-4444-4444-444444444444'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Solfege & Music Theory', 'Music', NULL);

-- Note: You'll need to insert a test student after creating an auth user
-- Example (replace with actual user_id from auth.users):
-- INSERT INTO students (id, user_id, first_name, last_initial, grade_band, parent_guardian_name, district) VALUES
-- ('99999999-9999-9999-9999-999999999999', 'your-auth-user-id', 'Alex', 'S', '7th Grade', 'Jane Smith', 'Pleasant Valley UFSD');

-- Then insert enrollments (replace student_id with actual id):
-- INSERT INTO enrollments (student_id, class_id, enrollment_date, status) VALUES
-- ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-01-01', 'active'),
-- ('99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-01-01', 'active'),
-- ('99999999-9999-9999-9999-999999999999', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2026-01-01', 'active'),
-- ('99999999-9999-9999-9999-999999999999', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2026-01-01', 'active');

-- Sample hours log (replace enrollment_id with actual enrollment ids):
-- INSERT INTO hours_log (enrollment_id, date, hours, description) VALUES
-- ('enrollment-id-1', '2026-01-15', 4.0, 'Pre-algebra lesson'),
-- ('enrollment-id-1', '2026-01-22', 4.0, 'Pre-algebra lesson'),
-- ('enrollment-id-2', '2026-01-18', 3.5, 'Earth science lab');

-- Sample portfolio items (replace student_id and class_id):
-- INSERT INTO portfolio_items (student_id, class_id, title, type, submitted_date, nys_standard, description) VALUES
-- ('student-id', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'The Hero''s Journey in Percy Jackson', 'essay', '2026-02-12', 'RL.7.2', 'Analysis of narrative themes'),
-- ('student-id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sedimentary Rock Formation', 'lab_report', '2026-01-28', 'MS-ESS2-2', 'Lab investigation report'),
-- ('student-id', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Hudson Valley Autumn', 'artwork', '2026-03-05', 'VA:Cr2.1', 'Watercolor painting');

-- Sample NYS standards met (replace student_id):
-- INSERT INTO nys_standards_met (student_id, standard_code, standard_description, subject_area, quarter, year) VALUES
-- ('student-id', 'NY-7.NS.A.2', 'Operations with rational numbers', 'Mathematics', 'Q2', 2026),
-- ('student-id', 'NY-7.EE.B.4', 'Problem solving with equations', 'Mathematics', 'Q2', 2026),
-- ('student-id', 'MS-ESS2-2', 'Plate tectonics and rock cycle', 'Science', 'Q2', 2026),
-- ('student-id', 'MS-ESS3-1', 'Human impacts on Earth systems', 'Science', 'Q2', 2026),
-- ('student-id', 'W.7.3', 'Narrative writing techniques', 'English Language Arts', 'Q2', 2026),
-- ('student-id', 'RL.7.2', 'Theme analysis in literature', 'English Language Arts', 'Q2', 2026),
-- ('student-id', 'VA:Cr2.1', 'Experimentation with materials', 'Visual Arts', 'Q2', 2026),
-- ('student-id', 'VA:Pr4.1', 'Portfolio selection and presentation', 'Visual Arts', 'Q2', 2026);

-- Sample game activity (replace student_id):
-- INSERT INTO game_activity (student_id, game_name, subject_area, date_played, duration_minutes, score) VALUES
-- ('student-id', 'Fraction Quest', 'Mathematics', '2026-02-10', 25, 850),
-- ('student-id', 'Number Ninjas', 'Mathematics', '2026-02-17', 30, 920),
-- ('student-id', 'Solfege Staircase', 'Music', '2026-02-05', 20, 15),
-- ('student-id', 'Rhythm Master', 'Music', '2026-02-19', 25, 12);

-- Sample instructor feedback (replace enrollment_id and instructor_id):
-- INSERT INTO instructor_feedback (enrollment_id, instructor_id, quarter, year, feedback_text) VALUES
-- ('enrollment-id-1', '11111111-1111-1111-1111-111111111111', 'Q2', 2026, 'Alex has shown excellent progress in algebraic thinking. Recommendation: Continue with geometry prep.'),
-- ('enrollment-id-4', '44444444-4444-4444-4444-444444444444', 'Q2', 2026, 'Exceptional attention to color mixing and composition. Ready for advanced techniques next quarter.');
