-- Foundation v1 identity model for Renaissance Kids Homeschooling Hub.
-- This migration intentionally replaces prototype identity tables with a UUID-first model.
-- Do not apply to production data without exporting/backing up prototype records first.

begin;

create extension if not exists pgcrypto;

-- Remove prototype tables with incompatible SERIAL/UUID assumptions.
drop table if exists public.worksheet_logs cascade;
drop table if exists public.educator_assessments cascade;
drop table if exists public.student_skills cascade;
drop table if exists public.teacher_profiles cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.classes cascade;
drop table if exists public.family_members cascade;
drop table if exists public.student_guardians cascade;
drop table if exists public.students cascade;
drop table if exists public.families cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.organization_memberships cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;

do $$
begin
  create type public.app_role as enum ('parent', 'teacher', 'admin', 'district_viewer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.enrollment_status as enum ('pending', 'active', 'cancelled', 'completed');
exception
  when duplicate_object then null;
end $$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  jurisdiction_code text not null default 'NY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  preferred_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id, role)
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  name text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  display_name text not null,
  legal_first_name text,
  legal_last_initial text,
  date_of_birth date,
  grade_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_guardians (
  student_id uuid not null references public.students(id) on delete cascade,
  guardian_id uuid not null references public.profiles(id) on delete cascade,
  relationship text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (student_id, guardian_id)
);

create table public.teacher_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  display_name text,
  bio text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'submitted', 'approved', 'rejected')),
  background_check_status text not null default 'pending'
    check (background_check_status in ('pending', 'invited', 'processing', 'clear', 'consider', 'rejected')),
  insurance_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  status public.enrollment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table public.student_skills (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject_area text not null,
  skill_code text,
  skill_name text not null,
  proficiency_level text
    check (proficiency_level in ('introduced', 'practicing', 'progressing', 'mastered')),
  evidence_notes text,
  assessed_by uuid references public.profiles(id) on delete set null,
  assessed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.educator_assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  subject_area text not null,
  assessment_period text,
  narrative text,
  standards text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.worksheet_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  worksheet_template_id uuid,
  worksheet_template_version_id uuid,
  subject_area text not null,
  standards text[] not null default '{}',
  score numeric,
  time_spent_seconds integer check (time_spent_seconds is null or time_spent_seconds >= 0),
  completed_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

-- ─── Resource catalog ─────────────────────────────────────────────────────────

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  title text not null,
  slug text not null unique,
  subject_tags text[] not null default '{}',
  grade_level text,
  resource_type text,
  price_cents integer not null default 0 check (price_cents >= 0),
  file_path text,
  is_member_only boolean not null default false,
  description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index idx_organization_memberships_profile on public.organization_memberships(profile_id);
create index idx_families_org on public.families(organization_id);
create index idx_students_family on public.students(family_id);
create index idx_student_guardians_guardian on public.student_guardians(guardian_id);
create index idx_enrollments_student on public.enrollments(student_id);
create index idx_enrollments_teacher on public.enrollments(teacher_id);
create index idx_student_skills_student on public.student_skills(student_id);
create index idx_educator_assessments_student on public.educator_assessments(student_id);
create index idx_worksheet_logs_student on public.worksheet_logs(student_id);
create index idx_resources_slug on public.resources(slug);

-- ─── Helper functions ─────────────────────────────────────────────────────────

create or replace function public.has_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships om
    where om.profile_id = auth.uid()
      and om.role = _role
  );
$$;

create or replace function public.can_access_student(_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin'::public.app_role)
    or exists (
      select 1
      from public.student_guardians sg
      where sg.student_id = _student_id
        and sg.guardian_id = auth.uid()
    )
    or exists (
      select 1
      from public.enrollments e
      where e.student_id = _student_id
        and e.teacher_id = auth.uid()
        and e.status = 'active'
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.families enable row level security;
alter table public.students enable row level security;
alter table public.student_guardians enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.student_skills enable row level security;
alter table public.educator_assessments enable row level security;
alter table public.worksheet_logs enable row level security;
alter table public.resources enable row level security;

create policy "Members view their organizations" on public.organizations
  for select using (
    exists (
      select 1 from public.organization_memberships om
      where om.organization_id = organizations.id
        and om.profile_id = auth.uid()
    )
    or public.has_role('admin'::public.app_role)
  );

create policy "Users view own profile" on public.profiles
  for select using (id = auth.uid() or public.has_role('admin'::public.app_role));

create policy "Users update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Users view own memberships" on public.organization_memberships
  for select using (profile_id = auth.uid() or public.has_role('admin'::public.app_role));

create policy "Admins manage memberships" on public.organization_memberships
  for all using (public.has_role('admin'::public.app_role))
  with check (public.has_role('admin'::public.app_role));

create policy "Guardians view own families" on public.families
  for select using (
    public.has_role('admin'::public.app_role)
    or exists (
      select 1
      from public.students s
      join public.student_guardians sg on sg.student_id = s.id
      where s.family_id = families.id
        and sg.guardian_id = auth.uid()
    )
  );

create policy "Guardians view own student links" on public.student_guardians
  for select using (guardian_id = auth.uid() or public.has_role('admin'::public.app_role));

create policy "Users view authorized students" on public.students
  for select using (public.can_access_student(id));

create policy "Guardians update authorized students" on public.students
  for update using (
    exists (
      select 1 from public.student_guardians sg
      where sg.student_id = students.id
        and sg.guardian_id = auth.uid()
    )
    or public.has_role('admin'::public.app_role)
  )
  with check (
    exists (
      select 1 from public.student_guardians sg
      where sg.student_id = students.id
        and sg.guardian_id = auth.uid()
    )
    or public.has_role('admin'::public.app_role)
  );

create policy "Teachers view own profile" on public.teacher_profiles
  for select using (
    profile_id = auth.uid()
    or verification_status = 'approved'
    or public.has_role('admin'::public.app_role)
  );

create policy "Teachers update own non-approval fields" on public.teacher_profiles
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "Admins manage teacher profiles" on public.teacher_profiles
  for all using (public.has_role('admin'::public.app_role))
  with check (public.has_role('admin'::public.app_role));

create policy "Public view published classes" on public.classes
  for select using (
    is_published = true
    or teacher_id = auth.uid()
    or public.has_role('admin'::public.app_role)
  );

create policy "Teachers manage own classes" on public.classes
  for all using (teacher_id = auth.uid() or public.has_role('admin'::public.app_role))
  with check (teacher_id = auth.uid() or public.has_role('admin'::public.app_role));

create policy "Authorized users view enrollments" on public.enrollments
  for select using (
    teacher_id = auth.uid()
    or public.can_access_student(student_id)
    or public.has_role('admin'::public.app_role)
  );

create policy "Authorized users view student skills" on public.student_skills
  for select using (public.can_access_student(student_id));

create policy "Authorized users insert student skills" on public.student_skills
  for insert with check (public.can_access_student(student_id));

create policy "Authorized users view assessments" on public.educator_assessments
  for select using (public.can_access_student(student_id));

create policy "Teachers insert assessments for active students" on public.educator_assessments
  for insert with check (public.can_access_student(student_id));

create policy "Authorized users view worksheet logs" on public.worksheet_logs
  for select using (public.can_access_student(student_id));

create policy "Authorized users insert worksheet logs" on public.worksheet_logs
  for insert with check (public.can_access_student(student_id));

create policy "Anyone can view published resources" on public.resources
  for select using (is_published = true or public.has_role('admin'::public.app_role));

create policy "Admins manage resources" on public.resources
  for all using (public.has_role('admin'::public.app_role))
  with check (public.has_role('admin'::public.app_role));

commit;
