-- Gmail credential storage (optional refresh support)

create table if not exists gmail_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table gmail_credentials enable row level security;

create policy "Users can view their gmail credentials" on gmail_credentials for select using (user_id = auth.uid());
create policy "Users can upsert their gmail credentials" on gmail_credentials for insert with check (user_id = auth.uid());
create policy "Users can update their gmail credentials" on gmail_credentials for update using (user_id = auth.uid());

create or replace function update_gmail_credentials_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_update_gmail_credentials_updated_at
before update on gmail_credentials
for each row execute function update_gmail_credentials_updated_at();


