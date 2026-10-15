-- Forward migration for both fresh installs and the original PR 34 schema.
-- Solfege persistence; remove original broad access without adding assessment writes.
-- A deployed database must reconcile its history against docs/solfege-launch.md.
BEGIN;

CREATE TABLE IF NOT EXISTS public.student_guardians (
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  guardian_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, guardian_user_id)
);
CREATE INDEX IF NOT EXISTS idx_student_guardians_user ON public.student_guardians(guardian_user_id);
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
-- No browser policies or writes: only trusted administration may establish kinship.
REVOKE ALL ON public.student_guardians FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.student_guardians TO service_role;

-- Owned by the migration administrator; fixed search_path and fully qualified
-- references prevent name substitution. Only returns access for the caller.
CREATE FUNCTION public.can_access_game_student(target_student UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = target_student AND p.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.student_guardians g
               WHERE g.student_id = target_student AND g.guardian_user_id = auth.uid())
  );
$$;
REVOKE ALL ON FUNCTION public.can_access_game_student(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_game_student(UUID) TO authenticated;
-- Prevent a browser from changing profiles.user_id to claim a student.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.profiles FROM PUBLIC, anon, authenticated;

DO $$
DECLARE col RECORD;
BEGIN
  FOR col IN SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles'
  LOOP
    EXECUTE format('REVOKE INSERT (%I), UPDATE (%I) ON public.profiles FROM PUBLIC, anon, authenticated', col.column_name, col.column_name);
  END LOOP;
END;
$$;

CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  grade_band TEXT,
  route_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.student_game_progress (
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL REFERENCES public.games(slug),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, game_slug)
);
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  game_slug TEXT NOT NULL,
  score INTEGER NOT NULL,
  accuracy INTEGER NOT NULL,
  streak INTEGER NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Existing data must validate; no invented scores, discarded sessions, or ID casts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.game_sessions'::regclass AND contype = 'f'
      AND confrelid NOT IN ('public.profiles'::regclass, 'public.games'::regclass)
  ) THEN
    RAISE EXCEPTION 'game_sessions has a noncanonical foreign key; reconcile student identity before upgrading';
  END IF;
END;
$$;
ALTER TABLE public.game_sessions
  ALTER COLUMN accuracy SET NOT NULL,
  ALTER COLUMN streak SET NOT NULL,
  ADD CONSTRAINT game_security_student_fk FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT game_security_slug_fk FOREIGN KEY (game_slug) REFERENCES public.games(slug),
  ADD CONSTRAINT game_security_score CHECK (score >= 0),
  ADD CONSTRAINT game_security_accuracy CHECK (accuracy BETWEEN 0 AND 100),
  ADD CONSTRAINT game_security_streak CHECK (streak >= 0),
  ADD CONSTRAINT game_security_metadata CHECK (jsonb_typeof(metadata) = 'object' AND octet_length(metadata::text) <= 4096);

-- Remove only the named policies introduced by the original PR migration.
-- Preserve the original PR's fail-closed skill boundary without granting game writes.
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents manage own student skills" ON public.student_skills;
DROP POLICY IF EXISTS "Parents manage own student game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Authenticated users can browse games" ON public.games;
DO $$
BEGIN
  IF to_regclass('public.resources') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can browse resources" ON public.resources';
  END IF;
  IF to_regclass('public.hub_resources') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can browse resources" ON public.hub_resources';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
      AND tablename IN ('games','game_sessions','student_game_progress','student_guardians')) THEN
    RAISE EXCEPTION 'Unexpected existing game policies; audit them before applying this migration';
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_game_sessions_student_played ON public.game_sessions(student_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game ON public.game_sessions(game_slug);
CREATE INDEX IF NOT EXISTS idx_student_game_progress_game ON public.student_game_progress(game_slug);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.games, public.student_game_progress, public.game_sessions FROM PUBLIC, anon, authenticated;
-- Table-level REVOKE does not remove pre-existing column privileges.
DO $$
DECLARE col RECORD;
BEGIN
  FOR col IN SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name IN
      ('games','game_sessions','student_game_progress','student_guardians')
  LOOP
    EXECUTE format('REVOKE SELECT (%I), INSERT (%I), UPDATE (%I), REFERENCES (%I) ON public.%I FROM PUBLIC, anon, authenticated',
      col.column_name, col.column_name, col.column_name, col.column_name, col.table_name);
  END LOOP;
END;
$$;
GRANT SELECT ON public.games TO authenticated;
GRANT SELECT ON public.game_sessions TO authenticated;
GRANT INSERT (student_id, game_slug, score, accuracy, streak, metadata) ON public.game_sessions TO authenticated;
GRANT SELECT ON public.student_game_progress TO authenticated;
GRANT INSERT (student_id, game_slug, score) ON public.student_game_progress TO authenticated;
GRANT UPDATE (score) ON public.student_game_progress TO authenticated;
GRANT ALL ON public.games, public.student_game_progress, public.game_sessions TO service_role;

CREATE POLICY games_browse ON public.games FOR SELECT TO authenticated USING (is_active);
CREATE POLICY progress_read ON public.student_game_progress FOR SELECT TO authenticated
  USING (public.can_access_game_student(student_id));
CREATE POLICY progress_insert ON public.student_game_progress FOR INSERT TO authenticated
  WITH CHECK (public.can_access_game_student(student_id)
    AND EXISTS (SELECT 1 FROM public.games WHERE slug = game_slug AND is_active));
CREATE POLICY progress_update ON public.student_game_progress FOR UPDATE TO authenticated
  USING (public.can_access_game_student(student_id))
  WITH CHECK (public.can_access_game_student(student_id)
    AND EXISTS (SELECT 1 FROM public.games WHERE slug = game_slug AND is_active));
CREATE POLICY sessions_read ON public.game_sessions FOR SELECT TO authenticated
  USING (public.can_access_game_student(student_id));
CREATE POLICY sessions_insert ON public.game_sessions FOR INSERT TO authenticated
  WITH CHECK (public.can_access_game_student(student_id)
    AND EXISTS (SELECT 1 FROM public.games WHERE slug = game_slug AND is_active));

CREATE FUNCTION public.set_game_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trig_games_updated_at ON public.games;
CREATE TRIGGER games_updated_at BEFORE UPDATE ON public.games
  FOR EACH ROW EXECUTE FUNCTION public.set_game_updated_at();
CREATE TRIGGER progress_updated_at BEFORE UPDATE ON public.student_game_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_game_updated_at();

-- PostgREST upsert includes all supplied columns in UPDATE, so expose a small
-- invoker RPC that uses a fixed conflict key and changes only score.
CREATE FUNCTION public.save_game_progress(p_student_id UUID, p_game_slug TEXT, p_score INTEGER)
RETURNS VOID LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  INSERT INTO public.student_game_progress (student_id, game_slug, score)
  VALUES (p_student_id, p_game_slug, p_score)
  ON CONFLICT (student_id, game_slug) DO UPDATE SET score = EXCLUDED.score;
$$;
REVOKE ALL ON FUNCTION public.save_game_progress(UUID, TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_game_progress(UUID, TEXT, INTEGER) TO authenticated;

INSERT INTO public.games (slug, title, description, subject, grade_band, route_path)
VALUES ('solfege-staircase', 'Solfege Staircase',
  'Interactive ear-training practice; game scores are not assessed mastery.',
  'Music', 'Elementary', '/games/solfege-staircase')
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;
-- Do not reactivate a game that an administrator disabled.
COMMIT;
