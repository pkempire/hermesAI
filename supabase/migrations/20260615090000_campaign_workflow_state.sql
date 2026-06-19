-- Durable prospecting workflow state.
-- Exa Websets are asynchronous and event-driven; these tables make Hermes'
-- campaign runs survive refreshes, cold starts, and webhook retries.

create table if not exists campaign_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  webset_id text not null,
  exa_external_id text,
  exa_dashboard_url text,
  source text not null default 'app',
  status text not null default 'created'
    check (status in ('created','running','idle','completed','failed','cancelled')),
  entity_type text not null default 'company',
  target_count integer not null default 25,
  original_query text,
  target_persona text,
  offer text,
  progress jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  last_event_id text,
  last_event_at timestamp with time zone,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, webset_id)
);

create table if not exists campaign_run_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references campaign_runs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null default 'exa',
  external_event_id text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamp with time zone default now(),
  processed_at timestamp with time zone,
  unique (provider, external_event_id)
);

create table if not exists campaign_run_prospects (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references campaign_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  webset_id text not null,
  exa_item_id text not null,
  status text not null default 'discovered'
    check (status in (
      'discovered',
      'company_enriching',
      'company_enriched',
      'contact_enriching',
      'contact_enriched',
      'draft_ready',
      'failed'
    )),
  company_enrichment_status text not null default 'queued'
    check (company_enrichment_status in ('queued','running','completed','failed','skipped')),
  contact_enrichment_status text not null default 'queued'
    check (contact_enrichment_status in ('queued','running','completed','failed','skipped')),
  draft_status text not null default 'queued'
    check (draft_status in ('queued','running','completed','failed','skipped')),
  source_url text,
  fit_score integer,
  prospect jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  error text,
  discovered_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (run_id, exa_item_id)
);

create table if not exists provider_calls (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references campaign_runs(id) on delete cascade,
  prospect_id uuid references campaign_run_prospects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null,
  operation text not null,
  status text not null default 'running'
    check (status in ('queued','running','succeeded','failed','skipped')),
  latency_ms integer,
  request jsonb not null default '{}'::jsonb,
  response jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

create table if not exists exa_webset_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cache_key text not null,
  webset_id text not null,
  exa_external_id text,
  exa_dashboard_url text,
  status text not null default 'active'
    check (status in ('active','running','completed','failed','expired')),
  entity_type text not null default 'company',
  criteria jsonb not null default '[]'::jsonb,
  enrichments jsonb not null default '[]'::jsonb,
  target_count integer not null default 25,
  result_count integer not null default 0,
  expires_at timestamp with time zone not null default (now() + interval '2 hours'),
  last_used_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, cache_key)
);

create index if not exists idx_campaign_runs_user_created on campaign_runs(user_id, created_at desc);
create index if not exists idx_campaign_runs_webset on campaign_runs(webset_id);
create index if not exists idx_campaign_run_events_run_received on campaign_run_events(run_id, received_at desc);
create index if not exists idx_campaign_run_events_type on campaign_run_events(event_type);
create index if not exists idx_campaign_run_prospects_run_updated on campaign_run_prospects(run_id, updated_at desc);
create index if not exists idx_campaign_run_prospects_webset on campaign_run_prospects(webset_id);
create index if not exists idx_provider_calls_run_provider on provider_calls(run_id, provider, operation);
create index if not exists idx_exa_webset_cache_user_key on exa_webset_cache(user_id, cache_key);
create index if not exists idx_exa_webset_cache_webset on exa_webset_cache(webset_id);

create or replace function update_campaign_workflow_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_campaign_runs_updated_at on campaign_runs;
create trigger trg_campaign_runs_updated_at
before update on campaign_runs
for each row execute function update_campaign_workflow_updated_at();

drop trigger if exists trg_campaign_run_prospects_updated_at on campaign_run_prospects;
create trigger trg_campaign_run_prospects_updated_at
before update on campaign_run_prospects
for each row execute function update_campaign_workflow_updated_at();

drop trigger if exists trg_exa_webset_cache_updated_at on exa_webset_cache;
create trigger trg_exa_webset_cache_updated_at
before update on exa_webset_cache
for each row execute function update_campaign_workflow_updated_at();

alter table campaign_runs enable row level security;
alter table campaign_run_events enable row level security;
alter table campaign_run_prospects enable row level security;
alter table provider_calls enable row level security;
alter table exa_webset_cache enable row level security;

drop policy if exists "Users can view campaign runs" on campaign_runs;
create policy "Users can view campaign runs" on campaign_runs
  for select using (user_id = auth.uid());
drop policy if exists "Users can insert campaign runs" on campaign_runs;
create policy "Users can insert campaign runs" on campaign_runs
  for insert with check (user_id = auth.uid());
drop policy if exists "Users can update campaign runs" on campaign_runs;
create policy "Users can update campaign runs" on campaign_runs
  for update using (user_id = auth.uid());

drop policy if exists "Users can view campaign run events" on campaign_run_events;
create policy "Users can view campaign run events" on campaign_run_events
  for select using (user_id = auth.uid());
drop policy if exists "Users can insert campaign run events" on campaign_run_events;
create policy "Users can insert campaign run events" on campaign_run_events
  for insert with check (user_id = auth.uid());

drop policy if exists "Users can view campaign run prospects" on campaign_run_prospects;
create policy "Users can view campaign run prospects" on campaign_run_prospects
  for select using (user_id = auth.uid());
drop policy if exists "Users can insert campaign run prospects" on campaign_run_prospects;
create policy "Users can insert campaign run prospects" on campaign_run_prospects
  for insert with check (user_id = auth.uid());
drop policy if exists "Users can update campaign run prospects" on campaign_run_prospects;
create policy "Users can update campaign run prospects" on campaign_run_prospects
  for update using (user_id = auth.uid());

drop policy if exists "Users can view provider calls" on provider_calls;
create policy "Users can view provider calls" on provider_calls
  for select using (user_id = auth.uid());
drop policy if exists "Users can insert provider calls" on provider_calls;
create policy "Users can insert provider calls" on provider_calls
  for insert with check (user_id = auth.uid());
drop policy if exists "Users can update provider calls" on provider_calls;
create policy "Users can update provider calls" on provider_calls
  for update using (user_id = auth.uid());

drop policy if exists "Users can view exa webset cache" on exa_webset_cache;
create policy "Users can view exa webset cache" on exa_webset_cache
  for select using (user_id = auth.uid());
drop policy if exists "Users can insert exa webset cache" on exa_webset_cache;
create policy "Users can insert exa webset cache" on exa_webset_cache
  for insert with check (user_id = auth.uid());
drop policy if exists "Users can update exa webset cache" on exa_webset_cache;
create policy "Users can update exa webset cache" on exa_webset_cache
  for update using (user_id = auth.uid());
