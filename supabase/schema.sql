-- MADHYUM CRM shared backend schema (Supabase/Postgres)
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'agent' check (role in ('admin','agent')),
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text not null,
  city text default '',
  wing text not null check (wing in ('Real Estate','Travel','Admission','Consultancy & Business Services','Events & Weddings')),
  requirement text not null,
  status text not null default 'NEW' check (status in ('NEW','CONTACTED','INTERESTED','HOT','CONVERTED','CLOSED')),
  followup_at timestamptz,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null default 'note',
  note text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end;$$;
drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at before update on public.leads for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from profiles where id=auth.uid() and role='admin')$$;

drop policy if exists "profiles self or admin read" on public.profiles;
create policy "profiles self or admin read" on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "leads read own or admin" on public.leads;
create policy "leads read own or admin" on public.leads for select to authenticated using (public.is_admin() or created_by=auth.uid() or assigned_to=auth.uid());
drop policy if exists "leads create self" on public.leads;
create policy "leads create self" on public.leads for insert to authenticated with check (created_by=auth.uid());
drop policy if exists "leads update own or admin" on public.leads;
create policy "leads update own or admin" on public.leads for update to authenticated using (public.is_admin() or created_by=auth.uid() or assigned_to=auth.uid()) with check (public.is_admin() or created_by=auth.uid() or assigned_to=auth.uid());

drop policy if exists "activities read visible leads" on public.lead_activities;
create policy "activities read visible leads" on public.lead_activities for select to authenticated using (exists(select 1 from public.leads l where l.id=lead_id and (public.is_admin() or l.created_by=auth.uid() or l.assigned_to=auth.uid())));
drop policy if exists "activities create visible leads" on public.lead_activities;
create policy "activities create visible leads" on public.lead_activities for insert to authenticated with check (created_by=auth.uid() and exists(select 1 from public.leads l where l.id=lead_id and (public.is_admin() or l.created_by=auth.uid() or l.assigned_to=auth.uid())));

-- Automatically create a profile after a new Auth user is created.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$begin insert into public.profiles(id,full_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),'agent') on conflict(id) do nothing; return new; end;$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
