-- ==========================================================
-- Bill Next — Complete Database Schema & Multi-Tenant Setup
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/eknexmgwtjqacsqftlnq/sql/new
-- ==========================================================

-- 1. Create / Update Organizations Table
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile_number text not null,
  status text not null default 'inactive',
  expiry_date timestamptz not null default (now() - interval '1 day'),
  items_count integer not null default 100, -- Maximum allowed items for this organization
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure items_count column exists if organizations already created
alter table public.organizations add column if not exists items_count integer not null default 100;

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

-- 3. Create Item Categories Table (Organization-Specific)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Create Items / Products Table (Organization-Specific)
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  short_code text not null,
  unit text not null default 'Piece', -- Piece, KG, Litre
  price numeric(12, 2) not null default 0.00,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Enable Row Level Security (RLS) on all tables
alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;

-- 6. Clean up previous policies to prevent duplicates
drop policy if exists "Allow all on organizations" on public.organizations;
drop policy if exists "Allow all on user_profiles" on public.user_profiles;
drop policy if exists "Allow all on categories" on public.categories;
drop policy if exists "Allow all on items" on public.items;

-- 7. Create Permissive Policies (All queries filter by org_id on frontend/backend)
create policy "Allow all on organizations" on public.organizations for all using (true) with check (true);
create policy "Allow all on user_profiles" on public.user_profiles for all using (true) with check (true);
create policy "Allow all on categories" on public.categories for all using (true) with check (true);
create policy "Allow all on items" on public.items for all using (true) with check (true);

-- 8. AUTOMATIC DATABASE TRIGGER on auth.users
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

  -- Create organisation with status 'inactive', expiry_date yesterday, items_count 100
  insert into public.organizations (name, mobile_number, status, expiry_date, items_count)
  values (org_name, user_mobile, 'inactive', yesterday_date, 100)
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
