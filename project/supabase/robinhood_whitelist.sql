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
-- Exporting the CSV is done via the Netlify function using the service_role key,
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
