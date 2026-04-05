-- ================================================
-- MIGRATION: 005_games_rls_and_seed
-- Purpose: Add games catalog, game sessions, enhance student_skills, and RLS
-- ================================================

-- 1. GAMES CATALOG
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

CREATE INDEX IF NOT EXISTS idx_games_is_active ON public.games(is_active);
CREATE INDEX IF NOT EXISTS idx_games_subject ON public.games(subject);

-- 2. GAME SESSIONS
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  game_slug TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  accuracy INTEGER,
  streak INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_student_id ON public.game_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_slug ON public.game_sessions(game_slug);
CREATE INDEX IF NOT EXISTS idx_game_sessions_played_at ON public.game_sessions(played_at DESC);

-- Add student FK when a canonical students table exists.
DO $$
BEGIN
  IF to_regclass('public.students') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'game_sessions_student_id_fkey'
        AND conrelid = 'public.game_sessions'::regclass
    ) THEN
      ALTER TABLE public.game_sessions
        ADD CONSTRAINT game_sessions_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
    END IF;
  END IF;
END;
$$;

-- 3. ENHANCE STUDENT_SKILLS
ALTER TABLE public.student_skills
  ADD COLUMN IF NOT EXISTS skill_tag TEXT,
  ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_skills_student_skill_tag
  ON public.student_skills(student_id, skill_tag)
  WHERE skill_tag IS NOT NULL;

-- 4. ENABLE RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.resources') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY';
  ELSIF to_regclass('public.hub_resources') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.hub_resources ENABLE ROW LEVEL SECURITY';
  END IF;
END;
$$;

-- 5. RLS POLICIES (Parent -> Student model, with safe fallback)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Parents manage own student skills" ON public.student_skills;

  IF to_regclass('public.students') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY "Parents manage own student skills"
        ON public.student_skills FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = student_skills.student_id
              AND s.parent_id = auth.uid()
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = student_skills.student_id
              AND s.parent_id = auth.uid()
          )
        )
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY "Parents manage own student skills"
        ON public.student_skills FOR ALL TO authenticated
        USING (student_id::text = auth.uid()::text)
        WITH CHECK (student_id::text = auth.uid()::text)
    $policy$;
  END IF;
END;
$$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Parents manage own student game sessions" ON public.game_sessions;

  IF to_regclass('public.students') IS NOT NULL THEN
    EXECUTE $policy$
      CREATE POLICY "Parents manage own student game sessions"
        ON public.game_sessions FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = game_sessions.student_id
              AND s.parent_id = auth.uid()
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = game_sessions.student_id
              AND s.parent_id = auth.uid()
          )
        )
    $policy$;
  ELSE
    EXECUTE $policy$
      CREATE POLICY "Parents manage own student game sessions"
        ON public.game_sessions FOR ALL TO authenticated
        USING (student_id::text = auth.uid()::text)
        WITH CHECK (student_id::text = auth.uid()::text)
    $policy$;
  END IF;
END;
$$;

DROP POLICY IF EXISTS "Authenticated users can browse games" ON public.games;
CREATE POLICY "Authenticated users can browse games"
  ON public.games FOR SELECT TO authenticated
  USING (TRUE);

DO $$
BEGIN
  IF to_regclass('public.resources') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can browse resources" ON public.resources';
    EXECUTE 'CREATE POLICY "Authenticated users can browse resources" ON public.resources FOR SELECT TO authenticated USING (TRUE)';
  ELSIF to_regclass('public.hub_resources') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can browse resources" ON public.hub_resources';
    EXECUTE 'CREATE POLICY "Authenticated users can browse resources" ON public.hub_resources FOR SELECT TO authenticated USING (TRUE)';
  END IF;
END;
$$;

-- 6. GAME SEED (Solfege Staircase)
INSERT INTO public.games (slug, title, description, subject, grade_band, route_path, is_active)
VALUES (
  'solfege-staircase',
  'Solfege Staircase',
  'Interactive ear-training game for note matching and interval direction practice.',
  'Music',
  'Elementary',
  '/games/solfege-staircase',
  TRUE
)
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  grade_band = EXCLUDED.grade_band,
  route_path = EXCLUDED.route_path,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 7. Updated-at trigger for games table
CREATE OR REPLACE FUNCTION public.set_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_games_updated_at ON public.games;
CREATE TRIGGER trig_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.set_games_updated_at();
