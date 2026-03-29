-- Jobs and usage tracking for quotas and background processing

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled')),
  attempts integer not null default 0,
  last_error text,
  result_ref jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_jobs_user_id on jobs(user_id);
create index if not exists idx_jobs_status on jobs(status);

alter table jobs enable row level security;

create policy "Users can view their jobs" on jobs for select using (user_id = auth.uid());
create policy "Users can insert their jobs" on jobs for insert with check (user_id = auth.uid());
create policy "Users can update their jobs" on jobs for update using (user_id = auth.uid());

create or replace function update_jobs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_update_jobs_updated_at
before update on jobs
for each row execute function update_jobs_updated_at();

-- Usage events to track monthly quotas and idempotency
create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0), -- positive for debit, negative for credit
  kind text not null, -- e.g., 'prospect_search', 'refund'
  idempotency_key text unique,
  meta jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists idx_usage_events_user_id_created_at on usage_events(user_id, created_at desc);

alter table usage_events enable row level security;
create policy "Users can view their usage events" on usage_events for select using (user_id = auth.uid());
create policy "Users can insert their usage events" on usage_events for insert with check (user_id = auth.uid());


