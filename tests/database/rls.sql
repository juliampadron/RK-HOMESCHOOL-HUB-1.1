BEGIN;
CREATE FUNCTION public.test_assert(ok BOOLEAN, message TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$ BEGIN
  IF ok IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'FAILED: %', message; END IF;
END $$;
CREATE FUNCTION public.test_denied(statement TEXT, expected_state TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER AS $$ BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = expected_state THEN RETURN; END IF;
    RAISE EXCEPTION 'Unexpected SQLSTATE %, expected %: %', SQLSTATE, expected_state, SQLERRM;
  END;
  RAISE EXCEPTION 'Statement unexpectedly allowed: %', statement;
END $$;
GRANT EXECUTE ON FUNCTION public.test_assert(BOOLEAN, TEXT), public.test_denied(TEXT, TEXT) TO anon, authenticated;

INSERT INTO auth.users(id) VALUES
 ('10000000-0000-0000-0000-000000000001'), -- parent A
 ('10000000-0000-0000-0000-000000000002'), -- parent B
 ('10000000-0000-0000-0000-000000000003'); -- student A login
INSERT INTO public.profiles(id, user_id, username) VALUES
 ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'student A'),
 ('20000000-0000-0000-0000-000000000002', NULL, 'student B');
INSERT INTO public.student_guardians VALUES
 ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
 ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002');
INSERT INTO public.games(slug,title,route_path,is_active) VALUES ('hidden','Hidden','/hidden',false);

SELECT public.test_assert((SELECT count(*) = 0 FROM pg_policies WHERE policyname IN ('Parents manage own student skills','Authenticated users can browse resources')), 'game migration must not alter unrelated policies');
SELECT public.test_assert((SELECT count(*) = 3 FROM pg_class WHERE oid IN ('public.games'::regclass,'public.game_sessions'::regclass,'public.student_game_progress'::regclass) AND relrowsecurity), 'RLS enabled on all game tables');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
SELECT public.test_assert(public.can_access_game_student('20000000-0000-0000-0000-000000000001'), 'parent A can access child A');
SELECT public.test_assert(NOT public.can_access_game_student('20000000-0000-0000-0000-000000000002'), 'parent A cannot access child B');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.games), 'inactive games hidden');
SELECT public.test_denied($q$INSERT INTO public.student_skills(student_id,standard_code,subject,grade_level,skill_name,mastery_level) VALUES ('20000000-0000-0000-0000-000000000001','NY-3W3','ELA','3','Writing','advanced')$q$, '42501');
SELECT public.save_game_progress('20000000-0000-0000-0000-000000000001','solfege-staircase',4);
SELECT public.save_game_progress('20000000-0000-0000-0000-000000000001','solfege-staircase',8);
SELECT public.test_assert((SELECT count(*) = 1 AND max(score) = 8 FROM public.student_game_progress), 'second save updates same row');
SELECT public.save_game_progress('20000000-0000-0000-0000-000000000001','solfege-staircase',0);
SELECT public.test_assert((SELECT score = 0 FROM public.student_game_progress), 'reset persists');
INSERT INTO public.game_sessions(student_id,game_slug,score,accuracy,streak)
 VALUES ('20000000-0000-0000-0000-000000000001','solfege-staircase',8,80,2);
SELECT public.test_denied($q$INSERT INTO public.game_sessions(student_id,game_slug,score,accuracy,streak,played_at) VALUES ('20000000-0000-0000-0000-000000000001','solfege-staircase',8,80,2,'2000-01-01')$q$, '42501');
SELECT public.test_denied($q$UPDATE public.game_sessions SET score=999$q$, '42501');
SELECT public.test_denied($q$DELETE FROM public.game_sessions$q$, '42501');
SELECT public.test_denied($q$UPDATE public.student_game_progress SET student_id='20000000-0000-0000-0000-000000000002'$q$, '42501');
SELECT public.test_denied($q$DELETE FROM public.student_game_progress$q$, '42501');
SELECT public.test_denied($q$INSERT INTO public.student_guardians VALUES ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001')$q$, '42501');
SELECT public.test_denied($q$UPDATE public.profiles SET user_id='10000000-0000-0000-0000-000000000001'$q$, '42501');
SELECT public.test_denied($q$SELECT public.save_game_progress('20000000-0000-0000-0000-000000000001','solfege-staircase',-1)$q$, '23514');
SELECT public.test_denied($q$SELECT public.save_game_progress('20000000-0000-0000-0000-000000000001','unknown',1)$q$, '42501');
SELECT public.test_denied($q$SELECT public.save_game_progress('20000000-0000-0000-0000-000000000001','hidden',1)$q$, '42501');
SELECT public.test_denied($q$INSERT INTO public.game_sessions(student_id,game_slug,score,accuracy,streak) VALUES ('20000000-0000-0000-0000-000000000001','solfege-staircase',1,101,0)$q$, '23514');
SELECT public.test_denied($q$INSERT INTO public.game_sessions(student_id,game_slug,score,accuracy,streak) VALUES ('20000000-0000-0000-0000-000000000001','solfege-staircase',1,50,-1)$q$, '23514');
SELECT public.test_denied($q$INSERT INTO public.game_sessions(student_id,game_slug,score,accuracy,streak,metadata) VALUES ('20000000-0000-0000-0000-000000000001','solfege-staircase',1,50,0,'[]')$q$, '23514');
SELECT public.test_denied($q$INSERT INTO public.game_sessions(student_id,game_slug,score,accuracy,streak) VALUES ('20000000-0000-0000-0000-000000000099','solfege-staircase',1,50,0)$q$, '42501');

SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
SELECT public.test_assert((SELECT count(*) = 0 FROM public.student_game_progress), 'parent B cannot read child A progress');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.game_sessions), 'parent B cannot read child A sessions');
SELECT public.test_denied($q$SELECT public.save_game_progress('20000000-0000-0000-0000-000000000001','solfege-staircase',99)$q$, '42501');
SELECT public.test_denied($q$INSERT INTO public.game_sessions(student_id,game_slug,score,accuracy,streak) VALUES ('20000000-0000-0000-0000-000000000001','solfege-staircase',1,100,1)$q$, '42501');
UPDATE public.student_game_progress SET score=99 WHERE student_id='20000000-0000-0000-0000-000000000001';
SELECT public.save_game_progress('20000000-0000-0000-0000-000000000002','solfege-staircase',3);
SELECT public.test_assert((SELECT count(*) = 1 AND max(score) = 3 FROM public.student_game_progress), 'parent B can save only child B');

SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
SELECT public.test_assert((SELECT score = 0 FROM public.student_game_progress), 'student self access uses profiles.user_id and cross-family update changed nothing');
SELECT public.save_game_progress('20000000-0000-0000-0000-000000000001','solfege-staircase',9);
SELECT public.test_denied($q$SELECT public.save_game_progress('20000000-0000-0000-0000-000000000002','solfege-staircase',99)$q$, '42501');
SELECT set_config('request.jwt.claim.sub','',true);
SELECT public.test_assert((SELECT count(*) = 0 FROM public.student_game_progress), 'null auth has no access even with authenticated role');

SET LOCAL ROLE anon;
SELECT public.test_denied($q$SELECT * FROM public.student_game_progress$q$, '42501');
SELECT public.test_denied($q$SELECT * FROM public.game_sessions$q$, '42501');
SELECT public.test_denied($q$SELECT public.save_game_progress('20000000-0000-0000-0000-000000000001','solfege-staircase',1)$q$, '42501');
SELECT public.test_denied($q$INSERT INTO public.game_sessions(student_id,game_slug,score,accuracy,streak) VALUES ('20000000-0000-0000-0000-000000000001','solfege-staircase',1,100,1)$q$, '42501');

RESET ROLE;
-- Integrity must hold even for trusted writers that bypass RLS.
SELECT public.test_denied($q$INSERT INTO public.game_sessions(student_id,game_slug,score,accuracy,streak) VALUES ('20000000-0000-0000-0000-000000000099','solfege-staircase',1,100,1)$q$, '23503');
SELECT public.test_denied($q$INSERT INTO public.game_sessions(student_id,game_slug,score,accuracy,streak) VALUES ('20000000-0000-0000-0000-000000000001','unknown',1,100,1)$q$, '23503');
DELETE FROM public.profiles WHERE id='20000000-0000-0000-0000-000000000001';
SELECT public.test_assert((SELECT count(*) = 0 FROM public.game_sessions WHERE student_id='20000000-0000-0000-0000-000000000001'), 'student deletion cascades sessions');
SELECT public.test_assert((SELECT count(*) = 0 FROM public.student_game_progress WHERE student_id='20000000-0000-0000-0000-000000000001'), 'student deletion cascades progress');
ROLLBACK;
