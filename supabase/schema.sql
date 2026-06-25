-- ============================================================
-- FamilyFlow — Complete Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com > SQL Editor)
--
-- SAFE TO RE-RUN: uses "if not exists" and "create or replace"
-- everywhere so it won't destroy existing data.
-- ============================================================


-- ─────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ─────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────

create table if not exists families (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  invite_code text unique not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

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


-- ─────────────────────────────────────────
-- 2. INDEXES
-- ─────────────────────────────────────────

create index if not exists chores_family_id_idx       on chores(family_id);
create index if not exists chores_assigned_to_idx     on chores(assigned_to);
create index if not exists chores_status_idx          on chores(status);
create index if not exists rewards_family_id_idx      on rewards(family_id);
create index if not exists redemptions_family_id_idx  on redemptions(family_id);
create index if not exists notifications_user_id_idx  on notifications(user_id);
create index if not exists notifications_family_id_idx on notifications(family_id);


-- ─────────────────────────────────────────
-- 3. AUTO-CREATE PROFILE ON SIGN-UP
-- ─────────────────────────────────────────

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
-- 4. RPC: create_family
--    Called from: CreateFamily.tsx
--    Creates a family with a random 4-char invite code
--    and assigns the calling user to it.
-- ─────────────────────────────────────────

create or replace function public.create_family(p_name text, p_role text default 'parent')
returns void as $$
declare
  v_family_id uuid;
  v_code text;
begin
  -- Generate a random 4-character invite code
  loop
    v_code := upper(substr(md5(random()::text), 1, 4));
    exit when not exists (select 1 from families where invite_code = v_code);
  end loop;

  insert into families (name, invite_code, created_by)
  values (p_name, v_code, auth.uid())
  returning id into v_family_id;

  update profiles
  set family_id = v_family_id,
      role = p_role
  where id = auth.uid();
end;
$$ language plpgsql security definer;


-- ─────────────────────────────────────────
-- 5. RPC: join_family
--    Called from: JoinFamily.tsx
--    Joins the calling user to an existing family
--    by invite code.
-- ─────────────────────────────────────────

create or replace function public.join_family(p_invite_code text, p_role text default 'child')
returns void as $$
declare
  v_family_id uuid;
begin
  select id into v_family_id
  from families
  where invite_code = upper(p_invite_code);

  if v_family_id is null then
    raise exception 'Invalid invite code';
  end if;

  update profiles
  set family_id = v_family_id,
      role = p_role
  where id = auth.uid();
end;
$$ language plpgsql security definer;


-- ─────────────────────────────────────────
-- 6. RPC: submit_proof
--    Called from: useProofSubmit.ts
--    Child submits (or resubmits) photo proof for a chore.
-- ─────────────────────────────────────────

create or replace function public.submit_proof(
  p_chore_id uuid,
  p_photo_url text default null,
  p_photo_path text default null,
  p_is_resubmit boolean default false
)
returns void as $$
begin
  update chores
  set status       = 'submitted',
      photo_url    = coalesce(p_photo_url, photo_url),
      photo_path   = coalesce(p_photo_path, photo_path),
      submitted_at = now(),
      rejection_comment = null
  where id = p_chore_id
    and assigned_to = auth.uid();

  if not found then
    raise exception 'Chore not found or not assigned to you';
  end if;

  -- Notify all parents in the family
  insert into notifications (user_id, family_id, type, title, body, chore_id)
  select p.id,
         c.family_id,
         'chore_submitted',
         case when p_is_resubmit then 'Chore resubmitted' else 'Chore submitted' end,
         (select full_name from profiles where id = auth.uid()) || ' submitted proof for "' || c.title || '"',
         c.id
  from chores c
  join profiles p on p.family_id = c.family_id and p.role = 'parent'
  where c.id = p_chore_id;
end;
$$ language plpgsql security definer;


-- ─────────────────────────────────────────
-- 7. RPC: approve_chore
--    Called from: ReviewProof.tsx
--    Parent approves a submitted chore and awards points.
-- ─────────────────────────────────────────

create or replace function public.approve_chore(
  p_chore_id uuid,
  p_approver_id uuid,
  p_bonus int default 0
)
returns void as $$
declare
  v_chore chores%rowtype;
  v_total_points int;
begin
  select * into v_chore from chores where id = p_chore_id;

  if v_chore is null then
    raise exception 'Chore not found';
  end if;
  if v_chore.status != 'submitted' then
    raise exception 'Chore is not in submitted status';
  end if;

  v_total_points := v_chore.points_value + p_bonus;

  -- Mark chore as approved
  update chores
  set status       = 'approved',
      approved_at  = now(),
      approved_by  = p_approver_id,
      completed_at = now()
  where id = p_chore_id;

  -- Award points to the child
  update profiles
  set points_total = points_total + v_total_points
  where id = v_chore.assigned_to;

  -- Update streak
  update profiles
  set streak_current = streak_current + 1,
      streak_longest = greatest(streak_longest, streak_current + 1)
  where id = v_chore.assigned_to;

  -- Notify the child
  insert into notifications (user_id, family_id, type, title, body, chore_id)
  values (
    v_chore.assigned_to,
    v_chore.family_id,
    'chore_approved',
    'Chore approved!',
    '"' || v_chore.title || '" was approved. You earned ' || v_total_points || ' points!',
    p_chore_id
  );
end;
$$ language plpgsql security definer;


-- ─────────────────────────────────────────
-- 8. RPC: reject_chore
--    Called from: ReviewProof.tsx
--    Parent rejects a submitted chore and sends it back.
-- ─────────────────────────────────────────

create or replace function public.reject_chore(
  p_chore_id uuid,
  p_comment text default null
)
returns void as $$
declare
  v_chore chores%rowtype;
begin
  select * into v_chore from chores where id = p_chore_id;

  if v_chore is null then
    raise exception 'Chore not found';
  end if;

  update chores
  set status            = 'rejected',
      rejection_comment = p_comment,
      submitted_at      = null
  where id = p_chore_id;

  -- Notify the child
  insert into notifications (user_id, family_id, type, title, body, chore_id)
  values (
    v_chore.assigned_to,
    v_chore.family_id,
    'chore_rejected',
    'Chore sent back',
    '"' || v_chore.title || '" needs another try.' ||
      case when p_comment is not null then ' — ' || p_comment else '' end,
    p_chore_id
  );
end;
$$ language plpgsql security definer;


-- ─────────────────────────────────────────
-- 9. RPC: redeem_reward
--    Called from: PointsRewards.tsx
--    Child spends points to redeem a reward.
-- ─────────────────────────────────────────

create or replace function public.redeem_reward(
  p_reward_id uuid,
  p_points_cost int
)
returns void as $$
declare
  v_profile profiles%rowtype;
  v_reward rewards%rowtype;
begin
  select * into v_profile from profiles where id = auth.uid();
  select * into v_reward from rewards where id = p_reward_id;

  if v_reward is null then
    raise exception 'Reward not found';
  end if;
  if not v_reward.is_active then
    raise exception 'This reward is not currently available';
  end if;
  if v_profile.points_total < p_points_cost then
    raise exception 'Not enough points';
  end if;

  -- Deduct points
  update profiles
  set points_total = points_total - p_points_cost
  where id = auth.uid();

  -- Create redemption record
  insert into redemptions (reward_id, redeemed_by, family_id, status)
  values (p_reward_id, auth.uid(), v_profile.family_id, 'pending');

  -- Notify all parents
  insert into notifications (user_id, family_id, type, title, body)
  select p.id,
         v_profile.family_id,
         'redemption_requested',
         'Reward requested',
         v_profile.full_name || ' wants to redeem "' || v_reward.title || '" (' || p_points_cost || ' pts)'
  from profiles p
  where p.family_id = v_profile.family_id
    and p.role = 'parent';
end;
$$ language plpgsql security definer;


-- ─────────────────────────────────────────
-- 10. RPC: set_member_points
--     Called from: MemberDetail.tsx
--     Parent manually adjusts a child's point balance.
-- ─────────────────────────────────────────

create or replace function public.set_member_points(
  p_member_id uuid,
  p_points int
)
returns void as $$
declare
  v_caller_family uuid;
  v_member_family uuid;
begin
  select family_id into v_caller_family from profiles where id = auth.uid();
  select family_id into v_member_family from profiles where id = p_member_id;

  if v_caller_family is null or v_caller_family != v_member_family then
    raise exception 'You can only adjust points for members in your family';
  end if;

  update profiles
  set points_total = greatest(0, p_points)
  where id = p_member_id;
end;
$$ language plpgsql security definer;


-- ─────────────────────────────────────────
-- 11. HELPER FUNCTION
-- ─────────────────────────────────────────

create or replace function auth_family_id()
returns uuid as $$
  select family_id from profiles where id = auth.uid()
$$ language sql security definer stable;


-- ─────────────────────────────────────────
-- 12. ROW LEVEL SECURITY
-- ─────────────────────────────────────────

alter table families      enable row level security;
alter table profiles      enable row level security;
alter table chores        enable row level security;
alter table rewards       enable row level security;
alter table redemptions   enable row level security;
alter table notifications enable row level security;

-- FAMILIES
drop policy if exists "family members can view their family" on families;
create policy "family members can view their family"
  on families for select
  using (id = auth_family_id());

drop policy if exists "authenticated users can create families" on families;
create policy "authenticated users can create families"
  on families for insert
  with check (auth.uid() is not null);

-- PROFILES
drop policy if exists "family members can view profiles" on profiles;
create policy "family members can view profiles"
  on profiles for select
  using (family_id = auth_family_id() or id = auth.uid());

drop policy if exists "users can update their own profile" on profiles;
create policy "users can update their own profile"
  on profiles for update
  using (id = auth.uid());

drop policy if exists "users can insert their own profile" on profiles;
create policy "users can insert their own profile"
  on profiles for insert
  with check (id = auth.uid());

-- CHORES
drop policy if exists "family members can view chores" on chores;
create policy "family members can view chores"
  on chores for select
  using (family_id = auth_family_id());

drop policy if exists "parents can insert chores" on chores;
create policy "parents can insert chores"
  on chores for insert
  with check (family_id = auth_family_id());

drop policy if exists "family members can update chores" on chores;
create policy "family members can update chores"
  on chores for update
  using (family_id = auth_family_id());

drop policy if exists "parents can delete chores" on chores;
create policy "parents can delete chores"
  on chores for delete
  using (family_id = auth_family_id());

-- REWARDS
drop policy if exists "family members can view rewards" on rewards;
create policy "family members can view rewards"
  on rewards for select
  using (family_id = auth_family_id());

drop policy if exists "parents can manage rewards" on rewards;
create policy "parents can manage rewards"
  on rewards for all
  using (family_id = auth_family_id());

-- REDEMPTIONS
drop policy if exists "family members can view redemptions" on redemptions;
create policy "family members can view redemptions"
  on redemptions for select
  using (family_id = auth_family_id());

drop policy if exists "members can insert redemptions" on redemptions;
create policy "members can insert redemptions"
  on redemptions for insert
  with check (family_id = auth_family_id() and redeemed_by = auth.uid());

drop policy if exists "parents can update redemptions" on redemptions;
create policy "parents can update redemptions"
  on redemptions for update
  using (family_id = auth_family_id());

-- NOTIFICATIONS
drop policy if exists "users can view their own notifications" on notifications;
create policy "users can view their own notifications"
  on notifications for select
  using (user_id = auth.uid());

drop policy if exists "family members can insert notifications" on notifications;
create policy "family members can insert notifications"
  on notifications for insert
  with check (family_id = auth_family_id());

drop policy if exists "users can update their own notifications" on notifications;
create policy "users can update their own notifications"
  on notifications for update
  using (user_id = auth.uid());


-- ─────────────────────────────────────────
-- 13. REALTIME
--     Enable realtime for tables the frontend subscribes to.
-- ─────────────────────────────────────────

alter publication supabase_realtime add table chores;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table redemptions;
alter publication supabase_realtime add table notifications;


-- ─────────────────────────────────────────
-- 14. STORAGE BUCKET: chore-photos
--     For photo proof uploads.
-- ─────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chore-photos', 'chore-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
drop policy if exists "Authenticated users can upload chore photos" on storage.objects;
create policy "Authenticated users can upload chore photos"
  on storage.objects for insert
  with check (
    bucket_id = 'chore-photos'
    and auth.uid() is not null
  );

drop policy if exists "Authenticated users can view chore photos" on storage.objects;
create policy "Authenticated users can view chore photos"
  on storage.objects for select
  using (
    bucket_id = 'chore-photos'
    and auth.uid() is not null
  );

drop policy if exists "Users can update their own chore photos" on storage.objects;
create policy "Users can update their own chore photos"
  on storage.objects for update
  using (
    bucket_id = 'chore-photos'
    and auth.uid() is not null
  );
