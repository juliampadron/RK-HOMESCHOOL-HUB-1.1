-- Migration: 004_payment_enrollment_system
-- Purpose: Add class catalog, payment intent tracking, and enrollment-payment linkage.

-- CLASSES TABLE
create table if not exists public.classes (
  id uuid default gen_random_uuid() primary key,
  instructor_id uuid references instructor_profiles(id) on delete cascade,
  title text not null,
  description text,
  price_cents integer not null,
  capacity integer default 10,
  schedule jsonb,
  status text check (status in ('draft','active','full','cancelled')) default 'draft',
  created_at timestamp default now()
);

-- PAYMENT INTENTS
create table if not exists public.payment_intents (
  id uuid default gen_random_uuid() primary key,
  stripe_session_id text unique,
  stripe_payment_intent_id text unique,
  parent_id uuid references profiles(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  instructor_id uuid references instructor_profiles(id),
  amount_cents integer not null,
  status text check (status in ('pending','succeeded','failed','refunded')) default 'pending',
  created_at timestamp default now(),
  completed_at timestamp
);

-- UPDATE ENROLLMENTS
alter table if exists enrollments add column if not exists payment_intent_id uuid references payment_intents(id);
alter table if exists enrollments add column if not exists enrolled_at timestamp default now();

-- ENABLE RLS
alter table classes enable row level security;
alter table payment_intents enable row level security;

-- RLS POLICIES - CLASSES
drop policy if exists "Public can view active approved classes" on classes;
create policy "Public can view active approved classes"
on classes for select
using (
  status = 'active' and exists (
    select 1 from instructor_profiles
    where instructor_profiles.id = classes.instructor_id
    and background_check_status = 'approved'
  )
);

drop policy if exists "Instructors manage own classes" on classes;
create policy "Instructors manage own classes"
on classes for all
using (auth.uid() = instructor_id);

drop policy if exists "Admins manage all classes" on classes;
create policy "Admins manage all classes"
on classes for all
using (public.has_role('admin'));

-- RLS POLICIES - PAYMENT INTENTS
drop policy if exists "Parents view own payments" on payment_intents;
create policy "Parents view own payments"
on payment_intents for select
using (auth.uid() = parent_id);

drop policy if exists "Instructors view their class payments" on payment_intents;
create policy "Instructors view their class payments"
on payment_intents for select
using (auth.uid() = instructor_id);

drop policy if exists "Admins view all payments" on payment_intents;
create policy "Admins view all payments"
on payment_intents for select
using (public.has_role('admin'));

-- INDEXES
create index if not exists idx_classes_instructor on classes(instructor_id);
create index if not exists idx_classes_status on classes(status);
create index if not exists idx_payment_intents_stripe_session on payment_intents(stripe_session_id);
create index if not exists idx_enrollments_student on enrollments(student_id);
create index if not exists idx_enrollments_instructor on enrollments(instructor_id);
