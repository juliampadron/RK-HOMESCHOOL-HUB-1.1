DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM public.game_sessions WHERE student_id='20000000-0000-0000-0000-000000000009' AND score=5) THEN
    RAISE EXCEPTION 'Legacy session lost';
  END IF;
  IF NOT EXISTS (SELECT FROM public.student_skills WHERE student_id='20000000-0000-0000-0000-000000000009' AND mastery_level='developing') THEN
    RAISE EXCEPTION 'Educational mastery changed';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename='hub_resources' AND policyname='protected_resources') THEN
    RAISE EXCEPTION 'Unrelated resource policy lost';
  END IF;
END $$;
