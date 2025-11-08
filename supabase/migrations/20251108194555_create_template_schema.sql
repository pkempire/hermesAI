-- Template marketplace database schema migration
-- Creates prospect_templates table, user_saved_templates table, and helper functions
-- for tracking template usage and saves

-- Create prospect_templates table
create table if not exists prospect_templates (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  description text,
  message text not null, -- The template message with placeholders
  category varchar(100), -- e.g., "Partnership", "Sales", "Recruiting"
  params jsonb, -- Array of parameter definitions

  -- Usage stats (fake social proof for now)
  save_count integer default 0,
  use_count integer default 0,

  -- Creator info
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Visibility
  is_public boolean default false,
  is_featured boolean default false,

  -- Tags for categorization
  tags text[] default '{}'
);

-- Create user_saved_templates table (many-to-many)
create table if not exists user_saved_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  template_id uuid references prospect_templates(id) on delete cascade,
  saved_at timestamp with time zone default now(),

  unique(user_id, template_id)
);

-- Create indexes for performance
create index if not exists idx_templates_public on prospect_templates(is_public) where is_public = true;
create index if not exists idx_templates_featured on prospect_templates(is_featured) where is_featured = true;
create index if not exists idx_templates_category on prospect_templates(category);
create index if not exists idx_templates_use_count on prospect_templates(use_count desc);
create index if not exists idx_user_saved_templates_user on user_saved_templates(user_id);
create index if not exists idx_user_saved_templates_template on user_saved_templates(template_id);

-- Enable row level security
alter table prospect_templates enable row level security;
alter table user_saved_templates enable row level security;

-- RLS policies for prospect_templates
-- Public templates are viewable by everyone
create policy "Public templates are viewable by everyone"
on prospect_templates
for select
to authenticated, anon
using (is_public = true);

-- Users can view their own templates
create policy "Users can view their own templates"
on prospect_templates
for select
to authenticated
using (created_by = (select auth.uid()));

-- Users can create their own templates
create policy "Users can create their own templates"
on prospect_templates
for insert
to authenticated
with check (created_by = (select auth.uid()));

-- Users can update their own templates
create policy "Users can update their own templates"
on prospect_templates
for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

-- Users can delete their own templates
create policy "Users can delete their own templates"
on prospect_templates
for delete
to authenticated
using (created_by = (select auth.uid()));

-- RLS policies for user_saved_templates
-- Users can view their own saved templates
create policy "Users can view their own saved templates"
on user_saved_templates
for select
to authenticated
using (user_id = (select auth.uid()));

-- Users can save templates
create policy "Users can save templates"
on user_saved_templates
for insert
to authenticated
with check (user_id = (select auth.uid()));

-- Users can delete their own saved templates
create policy "Users can delete their own saved templates"
on user_saved_templates
for delete
to authenticated
using (user_id = (select auth.uid()));

-- Helper function for incrementing template saves
create or replace function increment_template_saves(template_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update prospect_templates
  set save_count = save_count + 1
  where id = template_id;
end;
$$;

-- Helper function for decrementing template saves
create or replace function decrement_template_saves(template_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update prospect_templates
  set save_count = greatest(save_count - 1, 0)
  where id = template_id;
end;
$$;

-- Helper function for incrementing template uses
create or replace function increment_template_uses(template_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update prospect_templates
  set use_count = use_count + 1
  where id = template_id;
end;
$$;

-- Trigger for updating updated_at timestamp
create or replace function update_prospect_templates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_update_prospect_templates_updated_at
before update on prospect_templates
for each row execute function update_prospect_templates_updated_at();

