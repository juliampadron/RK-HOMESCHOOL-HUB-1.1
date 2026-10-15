-- Fresh-install baseline. Existing integer profile IDs require an audited mapping;
-- never cast, regenerate, or silently reassign live student identities.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT current_timestamp
);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    RAISE EXCEPTION 'profiles.id must be UUID. Stop and reconcile the deployed schema and migration history; do not convert live IDs automatically.';
  END IF;
END;
$$;
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
