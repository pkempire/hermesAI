-- Subscriptions for HermesAI plans and usage quotas

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free','starter','pro','enterprise')) default 'free',
  quota_monthly integer not null default 0,
  used_this_month integer not null default 0,
  period_start date not null default date_trunc('month', now())::date,
  trial_expires_at timestamp with time zone,
  invite_code text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists idx_subscriptions_user_id on subscriptions(user_id);

alter table subscriptions enable row level security;

create policy "Users can view their subscription" on subscriptions for select using (user_id = auth.uid());
create policy "Users can upsert their subscription" on subscriptions for insert with check (user_id = auth.uid());
create policy "Users can update their subscription" on subscriptions for update using (user_id = auth.uid());

create or replace function update_subscriptions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_update_subscriptions_updated_at
before update on subscriptions
for each row execute function update_subscriptions_updated_at();


