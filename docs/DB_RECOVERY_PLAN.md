# DB Recovery Plan

## What the backup is

The file `db_cluster-18-08-2025@08-11-02.backup` is a plain SQL cluster dump.

It contains:

- `auth.users` and related auth tables
- older public application tables such as:
  - `campaigns`
  - `chats`
  - `email_drafts`
  - `payments`
  - `prospects`
  - `sent_emails`
  - `usage_events`
  - `usage_summaries`
  - `users`

## Important constraint

This backup predates parts of the current app schema.

The current codebase now expects newer tables and shapes, including:

- `subscriptions`
- `gmail_credentials`
- newer `usage_events` columns used by quota logic

That means the best recovery path is **not** "restore the old dump directly into a fresh Supabase project and call it done".

## What is actually worth recovering

The backup was audited directly.

Observed state:

- `public.campaigns` is empty
- `public.chats` is empty
- `public.email_drafts` is empty
- `public.prospects` is empty
- `public.usage_events` is empty
- `public.users` is empty
- the useful retained state is mostly in `auth.*`

That changes the recommendation materially:

For the fastest safe launch, do **not** spend time trying to perfectly revive the old application data. There is effectively no meaningful product data to recover. The real decision is whether you want to migrate the old auth users or simply have those users sign in again on the new project.

## Best recovery path

1. Create a brand new Supabase project
2. Apply the current repo migrations first
3. Reconfigure Google OAuth and Stripe in the new project
4. Decide whether to migrate old auth users or simply let them sign in again

For this repo today, the fastest practical path is:

1. create the new project
2. apply current migrations
3. reconnect Google OAuth
4. let users sign in again
5. skip app-data recovery entirely

Only do auth migration if preserving old user IDs or hashed passwords matters.

## Recommended execution plan

### Step 1: Create the new project

- Create a new Supabase project
- Save the new:
  - project URL
  - anon key
  - service role key
  - database password

### Step 2: Apply current schema

Use the current repo migrations rather than the old dump as the base schema.

Suggested commands:

```bash
supabase login
supabase link --project-ref <new-project-ref>
supabase db push
```

Then verify the launch-critical tables exist:

- `campaigns`
- `prospects`
- `subscriptions`
- `usage_events`
- `gmail_credentials`

### Step 3: Recreate auth and provider settings

In the Supabase dashboard:

- enable Google provider
- set the site URL
- set the redirect URLs for local and production
- if you need existing sessions to remain valid, reuse the old JWT secret before distributing the new keys

If you are fine asking users to sign in again, stop here. This is the recommended weekend-launch path.

### Step 4: Optional auth migration

The backup includes `auth.users`, `auth.identities`, `auth.sessions`, and related tables.

Use Supabase's auth migration guidance only if preserving auth rows is important. Password hashes can be preserved, but this adds risk and setup time. Existing sessions remain valid only if the old JWT secret is reused in the new project.

### Step 5: Do not spend time on public table recovery unless new evidence appears

Because the audited public tables are empty, there is no launch value in trying to map or restore:

- `campaigns`
- `chats`
- `email_drafts`
- `prospects`
- `usage_events`
- `users`
- `payments`

If you later discover missing data from another source, import it into the current schema after the new project is already healthy.

## Practical recommendation

For this repo and this backup, the best solution is:

- create a fresh Supabase project
- apply current migrations
- wire Google OAuth again
- update local and production env vars
- have existing users sign in again
- recreate any Stripe and Gmail-linked state fresh

That gets Hermes back into a clean, launchable state faster than attempting a fragile full restore.

## Optional local inspection path

If you need to inspect the backup further before launch, restore it locally instead of into the new hosted project.

Use a temporary local Postgres or follow Supabase's local backup-restore flow, then inspect with `psql`. Keep that step isolated from the new production project.
