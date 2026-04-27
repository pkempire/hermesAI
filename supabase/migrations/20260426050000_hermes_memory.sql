-- Hermes memory layer
--
-- Stores durable per-user facts that Hermes should recall across sessions:
-- offer summaries, ICP definitions, past campaigns and their outcomes,
-- recurring prospect patterns, voice/tone preferences, etc.
--
-- Retrieval is hybrid:
--   1. Recent rows by user_id (cheap, always cheap).
--   2. Vector similarity via pgvector when an embedding is set.
--
-- Embeddings are 1536-dim (OpenAI text-embedding-3-small). Stored as the
-- pgvector `vector(1536)` type. The HNSW index is appropriate for a write-once
-- /read-often pattern; we expect ~hundreds-thousands of rows per power user.

create extension if not exists vector;

create table if not exists hermes_memory (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- The kind tells the agent what "shelf" this fact lives on. Keep it short
  -- and stable so prompts can filter by kind.
  kind          text not null check (
    kind in (
      'offer',         -- the user's product / service summary
      'icp',           -- a target ICP description
      'campaign',      -- past campaign brief + outcome
      'prospect',      -- a notable prospect or relationship
      'voice',         -- voice/tone/language preferences
      'note'           -- catch-all
    )
  ),
  title         text,
  content       text not null,
  embedding     vector(1536),
  metadata      jsonb not null default '{}'::jsonb,
  source        text,                                 -- e.g. 'website-scrape', 'user-correction', 'campaign-result'
  importance    smallint not null default 3 check (importance between 1 and 5),
  created_at    timestamp with time zone default now(),
  updated_at    timestamp with time zone default now(),
  archived_at   timestamp with time zone
);

create index if not exists idx_hermes_memory_user_kind
  on hermes_memory (user_id, kind, created_at desc);

create index if not exists idx_hermes_memory_user_archived
  on hermes_memory (user_id) where archived_at is null;

-- Vector search index. Use HNSW with cosine distance.
-- See https://github.com/pgvector/pgvector#hnsw for parameter guidance.
create index if not exists idx_hermes_memory_embedding
  on hermes_memory using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

alter table hermes_memory enable row level security;

drop policy if exists "users read own memory"        on hermes_memory;
drop policy if exists "users insert own memory"      on hermes_memory;
drop policy if exists "users update own memory"      on hermes_memory;
drop policy if exists "users delete own memory"      on hermes_memory;

create policy "users read own memory"
  on hermes_memory for select
  using (auth.uid() = user_id);

create policy "users insert own memory"
  on hermes_memory for insert
  with check (auth.uid() = user_id);

create policy "users update own memory"
  on hermes_memory for update
  using (auth.uid() = user_id);

create policy "users delete own memory"
  on hermes_memory for delete
  using (auth.uid() = user_id);

-- Cosine-similarity recall RPC. Server runs this with service role + a target
-- user_id; the function does not bypass RLS by itself (still the user_id
-- filter must be respected), but it lets us pass an embedding once instead of
-- bloating the URL.
create or replace function hermes_memory_recall(
  target_user_id  uuid,
  query_embedding vector(1536),
  kinds           text[] default null,
  match_count     int    default 8,
  min_importance  int    default 1
)
returns table (
  id          uuid,
  kind        text,
  title       text,
  content     text,
  metadata    jsonb,
  importance  smallint,
  created_at  timestamp with time zone,
  similarity  float
)
language sql
stable
as $$
  select
    m.id,
    m.kind,
    m.title,
    m.content,
    m.metadata,
    m.importance,
    m.created_at,
    1 - (m.embedding <=> query_embedding) as similarity
  from hermes_memory m
  where
    m.user_id = target_user_id
    and m.archived_at is null
    and m.embedding is not null
    and m.importance >= min_importance
    and (kinds is null or m.kind = any(kinds))
  order by m.embedding <=> query_embedding asc
  limit match_count;
$$;

create or replace function set_updated_at_hermes_memory()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_hermes_memory_updated_at on hermes_memory;
create trigger trg_hermes_memory_updated_at
  before update on hermes_memory
  for each row execute function set_updated_at_hermes_memory();
