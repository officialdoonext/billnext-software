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
  items_count integer not null default 50, -- Maximum allowed items for this organization
  logo_url text,
  city text,
  address text,
  gst_enabled boolean not null default false,
  gst_number text,
  gst_percentage numeric(5, 2) default 0.00,
  cgst_percentage numeric(5, 2) default 0.00,
  sgst_percentage numeric(5, 2) default 0.00,
  gst_type text default 'exclusive', -- 'inclusive' | 'exclusive'
  allow_out_of_stock_billing boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure all columns exist if organizations table was previously created
alter table public.organizations add column if not exists items_count integer not null default 50;
alter table public.organizations alter column items_count set default 50;
alter table public.organizations add column if not exists logo_url text;
alter table public.organizations add column if not exists city text;
alter table public.organizations add column if not exists address text;
alter table public.organizations add column if not exists gst_enabled boolean not null default false;
alter table public.organizations add column if not exists gst_number text;
alter table public.organizations add column if not exists gst_percentage numeric(5, 2) default 0.00;
alter table public.organizations add column if not exists cgst_percentage numeric(5, 2) default 0.00;
alter table public.organizations add column if not exists sgst_percentage numeric(5, 2) default 0.00;
alter table public.organizations add column if not exists gst_type text default 'exclusive';
alter table public.organizations add column if not exists allow_out_of_stock_billing boolean not null default true;

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
  stock integer not null default 0, -- Stock count
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure stock column exists if items already created
alter table public.items add column if not exists stock integer not null default 0;

-- 5. Create Customers Table (Organization-Specific)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  mobile_number text not null,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Create Bills / Sales Ledger Table (Organization-Specific)
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  bill_number text not null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  customer_mobile text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0.00,
  gst_percentage numeric(5, 2) default 0.00,
  tax_amount numeric(12, 2) not null default 0.00,
  total_amount numeric(12, 2) not null default 0.00,
  payment_method text not null default 'CASH', -- CASH, UPI, CARD, SPLIT
  split_details jsonb,
  created_at timestamptz not null default now()
);

-- 7. Create Organization Sub-Users / Staff Table (Organization-Specific RBAC)
create table if not exists public.org_users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  mobile_number text not null,
  email text not null, -- ${mobile_number}@bn.com
  mpin text not null, -- login password / PIN
  role text not null default 'staff', -- 'owner' | 'staff'
  permissions jsonb not null default '{}'::jsonb, -- page permission matrix
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Create Expense Categories Table (Organization-Specific)
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Create Expenses Table (Organization-Specific)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category_id uuid references public.expense_categories(id) on delete set null,
  amount numeric(12, 2) not null default 0.00,
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. Enable Row Level Security (RLS) on all tables
alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.customers enable row level security;
alter table public.bills enable row level security;
alter table public.org_users enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;

-- 11. Clean up previous policies to prevent duplicates
drop policy if exists "Allow all on organizations" on public.organizations;
drop policy if exists "Allow all on user_profiles" on public.user_profiles;
drop policy if exists "Allow all on categories" on public.categories;
drop policy if exists "Allow all on items" on public.items;
drop policy if exists "Allow all on customers" on public.customers;
drop policy if exists "Allow all on bills" on public.bills;
drop policy if exists "Allow all on org_users" on public.org_users;
drop policy if exists "Allow all on expense_categories" on public.expense_categories;
drop policy if exists "Allow all on expenses" on public.expenses;

-- 12. Create Permissive Policies (All queries filter by org_id on frontend/backend)
create policy "Allow all on organizations" on public.organizations for all using (true) with check (true);
create policy "Allow all on user_profiles" on public.user_profiles for all using (true) with check (true);
create policy "Allow all on categories" on public.categories for all using (true) with check (true);
create policy "Allow all on items" on public.items for all using (true) with check (true);
create policy "Allow all on customers" on public.customers for all using (true) with check (true);
create policy "Allow all on bills" on public.bills for all using (true) with check (true);
create policy "Allow all on org_users" on public.org_users for all using (true) with check (true);
create policy "Allow all on expense_categories" on public.expense_categories for all using (true) with check (true);
create policy "Allow all on expenses" on public.expenses for all using (true) with check (true);

-- 13. AUTOMATIC DATABASE TRIGGER on auth.users
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

  -- Create organisation with status 'inactive', expiry_date yesterday, items_count 50
  insert into public.organizations (name, mobile_number, status, expiry_date, items_count)
  values (org_name, user_mobile, 'inactive', yesterday_date, 50)
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
