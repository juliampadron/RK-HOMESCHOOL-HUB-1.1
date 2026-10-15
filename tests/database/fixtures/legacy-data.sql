-- Existing UUID installation: preserve real records and unrelated narrow policies.
INSERT INTO auth.users VALUES ('10000000-0000-0000-0000-000000000009');
INSERT INTO public.profiles(id,user_id,username) VALUES
 ('20000000-0000-0000-0000-000000000009','10000000-0000-0000-0000-000000000009','Existing student');
INSERT INTO public.student_skills(student_id,standard_code,subject,grade_level,skill_name,mastery_level)
 VALUES ('20000000-0000-0000-0000-000000000009','NY-3W3','ELA','3','Writing','developing');
INSERT INTO public.game_sessions(student_id,game_slug,score,accuracy,streak)
 VALUES ('20000000-0000-0000-0000-000000000009','solfege-staircase',5,80,2);
CREATE POLICY protected_resources ON public.hub_resources FOR SELECT TO authenticated USING (false);
GRANT UPDATE(user_id) ON public.profiles TO authenticated;
