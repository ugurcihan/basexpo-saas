-- Organizatörden firmaya fuar daveti sistemi
create table public.exhibitor_invitations (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  from_organizer_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id        uuid not null references public.profiles(id) on delete cascade,
  message           text,
  status            text not null default 'pending'
                    check (status in ('pending', 'accepted', 'rejected')),
  created_at        timestamptz not null default now(),
  unique (event_id, to_user_id)
);

alter table public.exhibitor_invitations enable row level security;

create policy "organizer manages own invitations"
  on public.exhibitor_invitations for all
  using (from_organizer_id = auth.uid());

create policy "exhibitor views own invitations"
  on public.exhibitor_invitations for select
  using (to_user_id = auth.uid());

create policy "exhibitor responds own invitations"
  on public.exhibitor_invitations for update
  using (to_user_id = auth.uid());

create index idx_exhibitor_invitations_to_user on public.exhibitor_invitations(to_user_id);
create index idx_exhibitor_invitations_event   on public.exhibitor_invitations(event_id);
create index idx_exhibitor_invitations_org     on public.exhibitor_invitations(from_organizer_id);
