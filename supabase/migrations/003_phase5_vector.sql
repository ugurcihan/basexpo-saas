-- ============================================================
-- Phase 5: pgvector similarity match function
-- Finds exhibitors most similar to a visitor's embedding
-- ============================================================

create or replace function match_exhibitors(
  query_embedding  vector(1536),
  match_count      int     default 10,
  min_score        float   default 0.3
)
returns table (
  id              uuid,
  company_name    text,
  description     text,
  logo_url        text,
  tags            text[],
  qr_token        text,
  event_name      text,
  event_location  text,
  similarity      float
)
language sql stable security invoker
as $$
  select
    ex.id,
    ex.company_name,
    ex.description,
    ex.logo_url,
    ex.tags,
    ex.qr_token,
    ev.name       as event_name,
    ev.location   as event_location,
    1 - (ex.embedding <=> query_embedding) as similarity
  from  public.exhibitors ex
  join  public.events ev on ev.id = ex.event_id
  where ex.embedding is not null
    and 1 - (ex.embedding <=> query_embedding) > min_score
  order by ex.embedding <=> query_embedding
  limit match_count;
$$;
