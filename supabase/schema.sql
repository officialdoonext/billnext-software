-- ==========================================================
-- Bill Next — Supabase Database Schema & Setup
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/eknexmgwtjqacsqftlnq/sql/new
-- ==========================================================

-- 1. Create Organizations Table
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile_number text not null,
  status text not null default 'inactive', -- Default: 'inactive'
  expiry_date timestamptz not null default (now() - interval '1 day'), -- Default: yesterday's date
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create User Profiles Table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  username text not null,
  email text not null,
  mobile_number text not null,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;

-- 4. Clean up any previous policies to avoid duplicates
drop policy if exists "Allow user to read own profile" on public.user_profiles;
drop policy if exists "Allow user to insert own profile" on public.user_profiles;
drop policy if exists "Allow user to update own profile" on public.user_profiles;
drop policy if exists "Allow users to read their organization" on public.organizations;
drop policy if exists "Allow authenticated users to insert organizations" on public.organizations;
drop policy if exists "Allow owners to update their organization" on public.organizations;
drop policy if exists "Allow all to insert organizations" on public.organizations;
drop policy if exists "Allow all to insert user_profiles" on public.user_profiles;
drop policy if exists "Allow read organizations" on public.organizations;
drop policy if exists "Allow read user_profiles" on public.user_profiles;

-- 5. Set Permissive Policies so Signup & Client can Save without RLS 401 Error
create policy "Allow all to insert organizations" 
  on public.organizations for insert 
  with check (true);

create policy "Allow read organizations" 
  on public.organizations for select 
  using (true);

create policy "Allow update organizations" 
  on public.organizations for update 
  using (true);

create policy "Allow all to insert user_profiles" 
  on public.user_profiles for insert 
  with check (true);

create policy "Allow read user_profiles" 
  on public.user_profiles for select 
  using (true);

create policy "Allow update user_profiles" 
  on public.user_profiles for update 
  using (true);

-- 6. AUTOMATIC DATABASE TRIGGER (Guarantees data is saved upon signup!)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
  org_name text;
  user_mobile text;
  yesterday_date timestamptz;
begin
  yesterday_date := now() - interval '1 day';
  org_name := coalesce(new.raw_user_meta_data->>'org_name', 'My Organization');
  user_mobile := coalesce(new.raw_user_meta_data->>'mobile_number', '');

  -- Create organisation with status 'inactive' and expiry_date yesterday
  insert into public.organizations (name, mobile_number, status, expiry_date)
  values (org_name, user_mobile, 'inactive', yesterday_date)
  returning id into new_org_id;

  -- Create user profile linking auth.users to organizations
  insert into public.user_profiles (id, org_id, username, email, mobile_number, role)
  values (new.id, new_org_id, coalesce(new.email, 'user'), coalesce(new.email, ''), user_mobile, 'owner')
  on conflict (id) do update set
    org_id = excluded.org_id,
    username = excluded.username,
    email = excluded.email,
    mobile_number = excluded.mobile_number;

  return new;
end;
$$ language plpgsql security definer;

-- Attach Trigger to auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
