create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  value numeric(12,2) not null default 0,
  category text not null check (category in ('IA', 'Domínio', 'Hospedagem', 'Ferramentas', 'Outros')),
  date date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  project text not null,
  hours numeric(10,2) not null default 0,
  date date not null default current_date,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null check (status in ('ideia', 'em andamento', 'pausado', 'finalizado')),
  estimated_value numeric(12,2) not null default 0,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_usage_entries (
  id uuid primary key default gen_random_uuid(),
  tool text not null,
  purpose text not null,
  time_used numeric(10,2) not null default 0,
  cost_estimated numeric(12,2) not null default 0,
  date date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row
execute function public.handle_updated_at();

drop trigger if exists time_entries_set_updated_at on public.time_entries;
create trigger time_entries_set_updated_at
before update on public.time_entries
for each row
execute function public.handle_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.handle_updated_at();

drop trigger if exists ai_usage_entries_set_updated_at on public.ai_usage_entries;
create trigger ai_usage_entries_set_updated_at
before update on public.ai_usage_entries
for each row
execute function public.handle_updated_at();
