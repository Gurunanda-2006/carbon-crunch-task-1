-- Supabase Schema for Fault-Tolerant Data Processing System

-- 1. Raw Events Table
create table if not exists public.raw_events (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text unique not null,
  source text not null,
  raw_payload jsonb not null,
  received_at timestamptz not null default now(),
  status text not null check (status in ('pending', 'processed', 'failed'))
);

-- Index for quick duplicate checks
create index if not exists raw_events_idempotency_key_idx on public.raw_events (idempotency_key);

-- 2. Normalized Events Table
create table if not exists public.normalized_events (
  id uuid primary key default gen_random_uuid(),
  raw_event_id uuid not null references public.raw_events(id) on delete cascade,
  client_id text not null,
  metric text not null,
  amount numeric,
  timestamp timestamptz,
  normalized_at timestamptz not null default now()
);

-- Index for analytics and joins
create index if not exists normalized_events_client_id_idx on public.normalized_events (client_id);
create index if not exists normalized_events_metric_idx on public.normalized_events (metric);

-- 3. Failed Events Table
create table if not exists public.failed_events (
  id uuid primary key default gen_random_uuid(),
  raw_event_id uuid not null references public.raw_events(id) on delete cascade,
  error_message text not null,
  failed_at timestamptz not null default now()
);

-- Allow anonymous access for the UI to read (optional, since our server acts as a proxy)
-- If we were hitting Supabase from the client directly, we'd need policies here.
-- Since our backend uses the service_role key, it bypasses RLS anyway.
