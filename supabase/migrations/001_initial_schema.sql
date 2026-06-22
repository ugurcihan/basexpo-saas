-- ============================================================
-- BasExpo MVP — Initial Schema
-- Faz 1: Auth + Roller + RLS
-- ============================================================

-- pgvector extension (Faz 5'te kullanılacak, şimdi aktif etmek daha kolay)
create extension if not exists vector;
create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('organizer', 'exhibitor', 'visitor', 'admin');
create type event_status as enum ('draft', 'published', 'active', 'ended');
create type lead_source as enum ('qr', 'manual');
create type connection_status as enum ('pending', 'accepted', 'rejected');

-- ============================================================
-- PROFILES
-- ============================================================

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'visitor',
  full_name   text not null default '',
  email       text not null default '',
  interests   text[] not null default '{}',
  avatar_url  text,
  embedding   vector(1536),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'visitor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- EVENTS
-- ============================================================

create table public.events (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  description   text not null default '',
  start_date    date not null,
  end_date      date not null,
  location      text not null default '',
  cover_url     text,
  status        event_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- HALLS
-- ============================================================

create table public.halls (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  floor       int not null default 1,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- BOOTHS
-- ============================================================

create table public.booths (
  id            uuid primary key default gen_random_uuid(),
  hall_id       uuid not null references public.halls(id) on delete cascade,
  code          text not null,
  exhibitor_id  uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique(hall_id, code)
);

-- ============================================================
-- EXHIBITORS
-- ============================================================

create table public.exhibitors (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  company_name  text not null,
  description   text not null default '',
  logo_url      text,
  tags          text[] not null default '{}',
  qr_token      text not null unique default replace(gen_random_uuid()::text, '-', ''),
  embedding     vector(1536),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================

create table public.products (
  id            uuid primary key default gen_random_uuid(),
  exhibitor_id  uuid not null references public.exhibitors(id) on delete cascade,
  name          text not null,
  description   text not null default '',
  image_url     text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- LEADS
-- ============================================================

create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  exhibitor_id  uuid not null references public.exhibitors(id) on delete cascade,
  visitor_id    uuid not null references public.profiles(id) on delete cascade,
  source        lead_source not null default 'qr',
  score         int not null default 0,
  note          text,
  created_at    timestamptz not null default now(),
  unique(exhibitor_id, visitor_id)
);

-- ============================================================
-- CONNECTIONS
-- ============================================================

create table public.connections (
  id          uuid primary key default gen_random_uuid(),
  from_user   uuid not null references public.profiles(id) on delete cascade,
  to_user     uuid not null references public.profiles(id) on delete cascade,
  status      connection_status not null default 'pending',
  created_at  timestamptz not null default now(),
  unique(from_user, to_user),
  check(from_user <> to_user)
);

-- ============================================================
-- MATCH SCORES
-- ============================================================

create table public.match_scores (
  id            uuid primary key default gen_random_uuid(),
  visitor_id    uuid not null references public.profiles(id) on delete cascade,
  exhibitor_id  uuid not null references public.exhibitors(id) on delete cascade,
  score         float not null default 0,
  reason        text not null default '',
  created_at    timestamptz not null default now(),
  unique(visitor_id, exhibitor_id)
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger trg_events_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

create trigger trg_exhibitors_updated_at
  before update on public.exhibitors
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.events         enable row level security;
alter table public.halls          enable row level security;
alter table public.booths         enable row level security;
alter table public.exhibitors     enable row level security;
alter table public.products       enable row level security;
alter table public.leads          enable row level security;
alter table public.connections    enable row level security;
alter table public.match_scores   enable row level security;

-- ---- PROFILES ----
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id);

-- ---- EVENTS ----
create policy "events: organizer full access"
  on public.events for all
  using (auth.uid() = organizer_id);

create policy "events: public read published"
  on public.events for select
  using (status in ('published', 'active', 'ended'));

-- ---- HALLS ----
create policy "halls: organizer full access"
  on public.halls for all
  using (
    exists (
      select 1 from public.events e
      where e.id = halls.event_id and e.organizer_id = auth.uid()
    )
  );

create policy "halls: public read"
  on public.halls for select
  using (true);

-- ---- BOOTHS ----
create policy "booths: organizer full access"
  on public.booths for all
  using (
    exists (
      select 1 from public.halls h
      join public.events e on e.id = h.event_id
      where h.id = booths.hall_id and e.organizer_id = auth.uid()
    )
  );

create policy "booths: public read"
  on public.booths for select
  using (true);

-- ---- EXHIBITORS ----
create policy "exhibitors: owner full access"
  on public.exhibitors for all
  using (auth.uid() = owner_id);

create policy "exhibitors: public read"
  on public.exhibitors for select
  using (true);

-- ---- PRODUCTS ----
create policy "products: exhibitor owner full access"
  on public.products for all
  using (
    exists (
      select 1 from public.exhibitors ex
      where ex.id = products.exhibitor_id and ex.owner_id = auth.uid()
    )
  );

create policy "products: public read"
  on public.products for select
  using (true);

-- ---- LEADS ----
create policy "leads: exhibitor owner read"
  on public.leads for select
  using (
    exists (
      select 1 from public.exhibitors ex
      where ex.id = leads.exhibitor_id and ex.owner_id = auth.uid()
    )
  );

create policy "leads: visitor can create"
  on public.leads for insert
  with check (auth.uid() = visitor_id);

create policy "leads: visitor own read"
  on public.leads for select
  using (auth.uid() = visitor_id);

-- ---- CONNECTIONS ----
create policy "connections: own read"
  on public.connections for select
  using (auth.uid() = from_user or auth.uid() = to_user);

create policy "connections: own insert"
  on public.connections for insert
  with check (auth.uid() = from_user);

create policy "connections: recipient update"
  on public.connections for update
  using (auth.uid() = to_user);

-- ---- MATCH SCORES ----
create policy "match_scores: own read"
  on public.match_scores for select
  using (auth.uid() = visitor_id);

create policy "match_scores: service write"
  on public.match_scores for insert
  with check (auth.uid() = visitor_id);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_events_organizer      on public.events(organizer_id);
create index idx_events_status         on public.events(status);
create index idx_halls_event           on public.halls(event_id);
create index idx_booths_hall           on public.booths(hall_id);
create index idx_booths_exhibitor      on public.booths(exhibitor_id);
create index idx_exhibitors_event      on public.exhibitors(event_id);
create index idx_exhibitors_owner      on public.exhibitors(owner_id);
create index idx_exhibitors_qr_token   on public.exhibitors(qr_token);
create index idx_products_exhibitor    on public.products(exhibitor_id);
create index idx_leads_exhibitor       on public.leads(exhibitor_id);
create index idx_leads_visitor         on public.leads(visitor_id);
create index idx_connections_from      on public.connections(from_user);
create index idx_connections_to        on public.connections(to_user);
create index idx_match_scores_visitor  on public.match_scores(visitor_id);
