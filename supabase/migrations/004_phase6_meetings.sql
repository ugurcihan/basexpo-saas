-- ============================================================
-- Phase 6: Meetings table for visitor-to-visitor scheduling
-- ============================================================

create type meeting_status as enum ('pending', 'accepted', 'declined');

create table public.meetings (
  id            uuid primary key default gen_random_uuid(),
  from_user     uuid not null references public.profiles(id) on delete cascade,
  to_user       uuid not null references public.profiles(id) on delete cascade,
  proposed_at   timestamptz not null,
  location      text not null default '',
  note          text,
  status        meeting_status not null default 'pending',
  created_at    timestamptz not null default now(),
  check(from_user <> to_user)
);

alter table public.meetings enable row level security;

create policy "meetings: participants can manage"
  on public.meetings for all
  using (auth.uid() = from_user or auth.uid() = to_user);

create index idx_meetings_from on public.meetings(from_user);
create index idx_meetings_to   on public.meetings(to_user);
