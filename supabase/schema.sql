-- ============================================================
-- FamilyFlow — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database.
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- FAMILIES
-- ─────────────────────────────────────────
create table if not exists families (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  invite_code text unique not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
create table if not exists profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  full_name      text not null default '',
  avatar_url     text,
  family_id      uuid references families(id) on delete set null,
  role           text not null default 'parent' check (role in ('parent', 'child')),
  points_total   int not null default 0,
  streak_current int not null default 0,
  streak_longest int not null default 0,
  created_at     timestamptz default now()
);

-- Auto-create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────
-- CHORES
-- ─────────────────────────────────────────
create table if not exists chores (
  id                 uuid primary key default uuid_generate_v4(),
  family_id          uuid not null references families(id) on delete cascade,
  title              text not null,
  description        text,
  assigned_to        uuid references profiles(id) on delete set null,
  assigned_by        uuid references profiles(id) on delete set null,
  points_value       int not null default 10,
  requires_photo     boolean not null default false,
  recurrence         text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly')),
  due_date           timestamptz,
  status             text not null default 'pending'
                     check (status in ('pending', 'in_progress', 'submitted', 'approved', 'rejected')),
  rejection_comment  text,
  photo_url          text,
  photo_path         text,
  submitted_at       timestamptz,
  completed_at       timestamptz,
  approved_at        timestamptz,
  approved_by        uuid references profiles(id) on delete set null,
  created_at         timestamptz default now()
);

create index if not exists chores_family_id_idx on chores(family_id);
create index if not exists chores_assigned_to_idx on chores(assigned_to);
create index if not exists chores_status_idx on chores(status);

-- ─────────────────────────────────────────
-- REWARDS
-- ─────────────────────────────────────────
create table if not exists rewards (
  id              uuid primary key default uuid_generate_v4(),
  family_id       uuid not null references families(id) on delete cascade,
  title           text not null,
  description     text,
  points_required int not null,
  reward_type     text not null default 'custom'
                  check (reward_type in ('money', 'screen_time', 'privilege', 'custom')),
  created_by      uuid references profiles(id) on delete set null,
  is_active       boolean not null default true,
  created_at      timestamptz default now()
);

create index if not exists rewards_family_id_idx on rewards(family_id);

-- ─────────────────────────────────────────
-- REDEMPTIONS
-- ─────────────────────────────────────────
create table if not exists redemptions (
  id             uuid primary key default uuid_generate_v4(),
  reward_id      uuid not null references rewards(id) on delete cascade,
  redeemed_by    uuid not null references profiles(id) on delete cascade,
  family_id      uuid not null references families(id) on delete cascade,
  status         text not null default 'pending'
                 check (status in ('pending', 'approved', 'denied')),
  requested_at   timestamptz default now(),
  reviewed_by    uuid references profiles(id) on delete set null,
  reviewed_at    timestamptz,
  denial_comment text
);

create index if not exists redemptions_family_id_idx on redemptions(family_id);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  family_id  uuid not null references families(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text not null,
  read       boolean not null default false,
  chore_id   uuid references chores(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_family_id_idx on notifications(family_id);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

alter table families      enable row level security;
alter table profiles      enable row level security;
alter table chores        enable row level security;
alter table rewards       enable row level security;
alter table redemptions   enable row level security;
alter table notifications enable row level security;

-- Helper: get current user's family_id
create or replace function auth_family_id()
returns uuid as $$
  select family_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Families: members can read their own family
create policy "family members can view their family"
  on families for select
  using (id = auth_family_id());

create policy "authenticated users can create families"
  on families for insert
  with check (auth.uid() is not null);

-- Profiles: anyone in the same family can read
create policy "family members can view profiles"
  on profiles for select
  using (family_id = auth_family_id() or id = auth.uid());

create policy "users can update their own profile"
  on profiles for update
  using (id = auth.uid());

create policy "users can insert their own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Chores: family-scoped
create policy "family members can view chores"
  on chores for select
  using (family_id = auth_family_id());

create policy "parents can insert chores"
  on chores for insert
  with check (family_id = auth_family_id());

create policy "family members can update chores"
  on chores for update
  using (family_id = auth_family_id());

create policy "parents can delete chores"
  on chores for delete
  using (family_id = auth_family_id());

-- Rewards: family-scoped
create policy "family members can view rewards"
  on rewards for select
  using (family_id = auth_family_id());

create policy "parents can manage rewards"
  on rewards for all
  using (family_id = auth_family_id());

-- Redemptions: family-scoped
create policy "family members can view redemptions"
  on redemptions for select
  using (family_id = auth_family_id());

create policy "members can insert redemptions"
  on redemptions for insert
  with check (family_id = auth_family_id() and redeemed_by = auth.uid());

create policy "parents can update redemptions"
  on redemptions for update
  using (family_id = auth_family_id());

-- Notifications: user-scoped
create policy "users can view their own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "family members can insert notifications"
  on notifications for insert
  with check (family_id = auth_family_id());

create policy "users can update their own notifications"
  on notifications for update
  using (user_id = auth.uid());

-- ─────────────────────────────────────────
-- STORAGE BUCKET
-- ─────────────────────────────────────────
-- Run this in your Supabase dashboard > Storage:
-- Create a bucket named "chore-photos" with:
--   - Public: false
--   - File size limit: 5MB
--   - Allowed MIME types: image/*
--
-- Then add this storage policy:
-- create policy "family members can upload photos"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'chore-photos' and
--     auth.uid() is not null
--   );
--
-- create policy "family members can view photos"
--   on storage.objects for select
--   using (
--     bucket_id = 'chore-photos' and
--     auth.uid() is not null
--   );
