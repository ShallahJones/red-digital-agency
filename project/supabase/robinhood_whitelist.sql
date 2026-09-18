-- Run this once in the Supabase SQL editor for your project.
-- Creates the table that backs the Robinhood collection whitelist page
-- and locks it down so the public site can only INSERT, never read the list back.

create table if not exists public.robinhood_whitelist (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  created_at timestamptz not null default now()
);

alter table public.robinhood_whitelist enable row level security;

-- Anyone (the anon key used by the site) can register a wallet...
drop policy if exists "Anyone can register" on public.robinhood_whitelist;
create policy "Anyone can register"
  on public.robinhood_whitelist
  for insert
  to anon
  with check (true);

-- ...but nobody using the public anon key can read the list back.
-- Exporting the CSV is done via the Vercel API route using the service_role key,
-- which bypasses RLS and is never exposed to the browser.
drop policy if exists "No public reads" on public.robinhood_whitelist;

-- Hard cap the free-mint whitelist at 199 addresses (out of 1999 total supply).
-- This is enforced in the database, not just on the page, so it can't be bypassed
-- by hitting the Supabase API directly. Concurrent inserts at the exact boundary
-- could in theory both pass the count check before either commits (a small race),
-- but for normal signup traffic this reliably stops the list at the cap.
create or replace function public.enforce_whitelist_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.robinhood_whitelist) >= 199 then
    raise exception 'WHITELIST_FULL' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_whitelist_cap on public.robinhood_whitelist;
create trigger trg_enforce_whitelist_cap
  before insert on public.robinhood_whitelist
  for each row execute function public.enforce_whitelist_cap();

-- --------------------------------------------------------------------------
-- Overflow log: the real whitelist above stays hard-capped at 199 — that's
-- still the actual free-mint allocation and registration still closes there.
-- This second table exists ONLY so the site can display how many additional
-- wallets tried to register after the list was full (e.g. "340 attempted /
-- 199 accepted"), for hype purposes. It has no cap and confers no clearance.
-- --------------------------------------------------------------------------
create table if not exists public.robinhood_whitelist_overflow (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  created_at timestamptz not null default now()
);

alter table public.robinhood_whitelist_overflow enable row level security;

drop policy if exists "Anyone can log overflow" on public.robinhood_whitelist_overflow;
create policy "Anyone can log overflow"
  on public.robinhood_whitelist_overflow
  for insert
  to anon
  with check (true);

drop policy if exists "No public reads" on public.robinhood_whitelist_overflow;
