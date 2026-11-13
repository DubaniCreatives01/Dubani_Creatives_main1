-- Owner invoice uploads, plus a ledger amount and paid flag on existing invoices.
-- Idempotent: safe to run more than once.
-- Does not rewrite invoice totals, status, or payment rows.
-- Does not change the company-vault bucket or its policies.
--
-- Apply in the Supabase SQL editor (project maofytcvzlapcqegrvpp) or with
-- `supabase db query --linked -f supabase/migrations/20261113143000_invoice_uploads.sql`.
-- The owner id must stay the same as OWNER_ID in js/supabase-client.js.
-- This migration is not applied by the pull request that adds it.

create schema if not exists private;

-- Same helper the vault migration creates. Skip it when it already exists.
do $do$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'set_updated_at'
  ) then
    execute $fn$
      create function private.set_updated_at()
      returns trigger
      language plpgsql
      set search_path to ''
      as $body$
      begin
        new.updated_at := now();
        return new;
      end;
      $body$
    $fn$;
  end if;
end
$do$;

-- Dashboard amount and paid flag. Null keeps today's behaviour:
-- the calculated total, and paid only when status is 'paid'.
-- invoices_guard allows these columns to change on issued documents
-- because it does not treat them as document totals or status.
alter table public.invoices
  add column if not exists tracked_amount numeric(12,2),
  add column if not exists marked_paid boolean;

do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'invoices_tracked_amount_check'
      and conrelid = 'public.invoices'::regclass
  ) then
    alter table public.invoices
      add constraint invoices_tracked_amount_check
      check (tracked_amount is null or (tracked_amount >= 0 and tracked_amount <= 100000000));
  end if;
end
$do$;

comment on column public.invoices.tracked_amount is
  'Optional ledger amount in ZAR. Null uses the calculated invoice total. Does not change the issued document.';
comment on column public.invoices.marked_paid is
  'Optional paid override for the dashboard. Null follows status = paid. Does not insert or delete payments.';

-- 20 MB. PDF and images only. Private: preview and download use signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoice-uploads',
  'invoice-uploads',
  false,
  20971520,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.invoice_uploads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id uuid not null,
  name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  amount numeric(12,2) not null default 0,
  paid boolean not null default false,
  issue_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_uploads_amount_check check (amount >= 0 and amount <= 100000000),
  constraint invoice_uploads_name_len check (char_length(btrim(name)) between 1 and 200),
  constraint invoice_uploads_size check (size_bytes > 0 and size_bytes <= 20971520),
  constraint invoice_uploads_mime check (mime_type in (
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
  )),
  constraint invoice_uploads_path_owner check (
    storage_path like (owner_id::text || '/%')
    and storage_path !~ '\.\.'
  )
);

do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'invoice_uploads_client_owner_fk'
      and conrelid = 'public.invoice_uploads'::regclass
  ) then
    alter table public.invoice_uploads
      add constraint invoice_uploads_client_owner_fk
      foreign key (client_id, owner_id)
      references public.clients (id, owner_id)
      on delete restrict;
  end if;
end
$do$;

create unique index if not exists invoice_uploads_storage_path_idx
  on public.invoice_uploads (storage_path);

create index if not exists invoice_uploads_owner_client_idx
  on public.invoice_uploads (owner_id, client_id);

create index if not exists invoice_uploads_owner_created_idx
  on public.invoice_uploads (owner_id, created_at desc);

drop trigger if exists invoice_uploads_set_updated_at on public.invoice_uploads;
create trigger invoice_uploads_set_updated_at
  before update on public.invoice_uploads
  for each row execute function private.set_updated_at();

alter table public.invoice_uploads enable row level security;

revoke all on table public.invoice_uploads from anon, authenticated, public;
grant select, insert, update, delete on table public.invoice_uploads to authenticated;

-- Pinned to the owner account, not "any authenticated user".
-- (select auth.uid()) is evaluated once per statement.

drop policy if exists invoice_uploads_select_owner on public.invoice_uploads;
create policy invoice_uploads_select_owner
  on public.invoice_uploads
  for select
  to authenticated
  using (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

drop policy if exists invoice_uploads_insert_owner on public.invoice_uploads;
create policy invoice_uploads_insert_owner
  on public.invoice_uploads
  for insert
  to authenticated
  with check (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

drop policy if exists invoice_uploads_update_owner on public.invoice_uploads;
create policy invoice_uploads_update_owner
  on public.invoice_uploads
  for update
  to authenticated
  using (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  )
  with check (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

drop policy if exists invoice_uploads_delete_owner on public.invoice_uploads;
create policy invoice_uploads_delete_owner
  on public.invoice_uploads
  for delete
  to authenticated
  using (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

-- Objects live at {owner_id}/{client_id}/{file_id}/{filename}.
drop policy if exists invoice_uploads_storage_select_owner on storage.objects;
create policy invoice_uploads_storage_select_owner
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'invoice-uploads'
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (storage.foldername(name))[1] = '651904dd-e516-42cb-934a-93603744deef'
  );

drop policy if exists invoice_uploads_storage_insert_owner on storage.objects;
create policy invoice_uploads_storage_insert_owner
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'invoice-uploads'
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (storage.foldername(name))[1] = '651904dd-e516-42cb-934a-93603744deef'
  );

drop policy if exists invoice_uploads_storage_update_owner on storage.objects;
create policy invoice_uploads_storage_update_owner
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'invoice-uploads'
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (storage.foldername(name))[1] = '651904dd-e516-42cb-934a-93603744deef'
  )
  with check (
    bucket_id = 'invoice-uploads'
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (storage.foldername(name))[1] = '651904dd-e516-42cb-934a-93603744deef'
  );

drop policy if exists invoice_uploads_storage_delete_owner on storage.objects;
create policy invoice_uploads_storage_delete_owner
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'invoice-uploads'
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (storage.foldername(name))[1] = '651904dd-e516-42cb-934a-93603744deef'
  );

comment on table public.invoice_uploads is
  'Owner-only copies of invoices uploaded for a client. Bytes live in the private invoice-uploads bucket.';
