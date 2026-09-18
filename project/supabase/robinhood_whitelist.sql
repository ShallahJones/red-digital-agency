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
