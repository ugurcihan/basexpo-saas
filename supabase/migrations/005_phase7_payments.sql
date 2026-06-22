-- ============================================================
-- BasExpo Faz 7 — Stripe Ödemeleri
-- ============================================================

alter table public.exhibitors
  add column if not exists stripe_payment_id text,
  add column if not exists paid_at           timestamptz,
  add column if not exists booth_fee_cents   int not null default 0;

-- Ödeme durumu view'ı
create or replace view public.exhibitor_payment_status as
select
  ex.id,
  ex.company_name,
  ex.owner_id,
  ex.event_id,
  ex.paid_at is not null as is_paid,
  ex.paid_at,
  ex.stripe_payment_id,
  ex.booth_fee_cents,
  ev.name as event_name,
  ev.organizer_id
from public.exhibitors ex
join public.events ev on ev.id = ex.event_id;

-- Organizer gelir özeti fonksiyonu
create or replace function public.organizer_revenue(p_organizer_id uuid)
returns table (
  total_exhibitors  bigint,
  paid_exhibitors   bigint,
  total_revenue_cents bigint
)
language sql stable security invoker as $$
  select
    count(*)                                          as total_exhibitors,
    count(*) filter (where ex.paid_at is not null)   as paid_exhibitors,
    coalesce(sum(ex.booth_fee_cents)
      filter (where ex.paid_at is not null), 0)      as total_revenue_cents
  from public.exhibitors ex
  join public.events ev on ev.id = ex.event_id
  where ev.organizer_id = p_organizer_id;
$$;
