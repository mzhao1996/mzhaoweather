create extension if not exists "pgcrypto";

create table if not exists public.weather_queries (
  id uuid primary key default gen_random_uuid(),
  location text not null,
  weather_data jsonb not null,
  queried_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists weather_queries_queried_at_idx
  on public.weather_queries (queried_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists weather_queries_set_updated_at on public.weather_queries;

create trigger weather_queries_set_updated_at
before update on public.weather_queries
for each row execute function public.set_updated_at();

alter table public.weather_queries enable row level security;

create policy "Service role can manage weather queries"
on public.weather_queries
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
