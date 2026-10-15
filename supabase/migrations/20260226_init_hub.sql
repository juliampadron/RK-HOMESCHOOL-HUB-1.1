-- Legacy migration identifier retained for migration-history compatibility.
-- profiles is created by 000_profiles_baseline.sql before dependent tables.
-- Supabase auth roles are used instead of unrelated custom database roles.
CREATE TABLE IF NOT EXISTS public.hub_resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT current_timestamp
);
