-- TrackMyFood: Tabellen + Zugriffsregeln. Kann gefahrlos mehrfach laufen.
-- Datum und Uhrzeit werden bewusst als deutsche Ortszeit (Europe/Berlin) gespeichert.

create table if not exists public.tmf_entries (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('tina', 'pascal')),
  kind text not null check (kind in ('essen', 'beobachtung')),
  text text not null,
  entry_date date not null,
  entry_time time not null,
  link_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists tmf_entries_person_idx
  on public.tmf_entries (person, entry_date desc, entry_time desc);

create table if not exists public.tmf_cycles (
  id uuid primary key default gen_random_uuid(),
  person text not null default 'tina' check (person = 'tina'),
  start_date date not null,
  created_at timestamptz not null default now()
);

alter table public.tmf_entries enable row level security;
alter table public.tmf_cycles enable row level security;

drop policy if exists "tmf_entries_all" on public.tmf_entries;
create policy "tmf_entries_all" on public.tmf_entries
  for all to anon using (true) with check (true);

drop policy if exists "tmf_cycles_all" on public.tmf_cycles;
create policy "tmf_cycles_all" on public.tmf_cycles
  for all to anon using (true) with check (true);
