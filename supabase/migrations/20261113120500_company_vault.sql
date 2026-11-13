-- Private company file vault for the Dubani Creatives owner dashboard.
-- Idempotent: safe to run more than once. Does not touch invoice tables.
--
-- Apply in the Supabase SQL editor (project maofytcvzlapcqegrvpp) or with
-- `supabase db query --linked -f supabase/migrations/20261113120500_company_vault.sql`.
-- The owner id must stay the same as OWNER_ID in js/supabase-client.js.
-- This migration was not applied by the pull request that added it.

create schema if not exists private;

-- Same helper the invoice tables already use. Create it only when this
-- migration runs somewhere that does not have it yet.
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

-- 50 MB. Matches the types the vault page accepts.
-- Keep public = false. Previews and downloads use short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-vault',
  'company-vault',
  false,
  52428800,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed'
  ]::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.vault_folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vault_folders_name_len check (char_length(btrim(name)) between 1 and 80)
);

create table if not exists public.vault_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  folder_id uuid not null references public.vault_folders (id) on delete restrict,
  name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  expires_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vault_files_name_len check (char_length(btrim(name)) between 1 and 200),
  constraint vault_files_size check (size_bytes > 0 and size_bytes <= 52428800),
  constraint vault_files_mime check (mime_type in (
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed'
  )),
  constraint vault_files_path_owner check (
    storage_path like (owner_id::text || '/%')
    and storage_path !~ '\.\.'
  )
);

create unique index if not exists vault_folders_owner_lower_name_idx
  on public.vault_folders (owner_id, lower(name));

create unique index if not exists vault_files_storage_path_idx
  on public.vault_files (storage_path);

create index if not exists vault_folders_owner_id_idx
  on public.vault_folders (owner_id);

create index if not exists vault_files_owner_folder_idx
  on public.vault_files (owner_id, folder_id);

create index if not exists vault_files_owner_expires_idx
  on public.vault_files (owner_id, expires_on)
  where expires_on is not null;

drop trigger if exists vault_folders_set_updated_at on public.vault_folders;
create trigger vault_folders_set_updated_at
  before update on public.vault_folders
  for each row execute function private.set_updated_at();

drop trigger if exists vault_files_set_updated_at on public.vault_files;
create trigger vault_files_set_updated_at
  before update on public.vault_files
  for each row execute function private.set_updated_at();

alter table public.vault_folders enable row level security;
alter table public.vault_files enable row level security;

-- Default privileges on this project can grant new public tables to anon.
revoke all on table public.vault_folders from anon, authenticated, public;
revoke all on table public.vault_files from anon, authenticated, public;
grant select, insert, update, delete on table public.vault_folders to authenticated;
grant select, insert, update, delete on table public.vault_files to authenticated;

-- Pinned to the owner account, not "any authenticated user".
-- Public sign-up must not be able to read or write the vault.
-- (select auth.uid()) is evaluated once per statement.

drop policy if exists vault_folders_select_owner on public.vault_folders;
create policy vault_folders_select_owner
  on public.vault_folders
  for select
  to authenticated
  using (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

drop policy if exists vault_folders_insert_owner on public.vault_folders;
create policy vault_folders_insert_owner
  on public.vault_folders
  for insert
  to authenticated
  with check (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

drop policy if exists vault_folders_update_owner on public.vault_folders;
create policy vault_folders_update_owner
  on public.vault_folders
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

drop policy if exists vault_folders_delete_owner on public.vault_folders;
create policy vault_folders_delete_owner
  on public.vault_folders
  for delete
  to authenticated
  using (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

drop policy if exists vault_files_select_owner on public.vault_files;
create policy vault_files_select_owner
  on public.vault_files
  for select
  to authenticated
  using (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

drop policy if exists vault_files_insert_owner on public.vault_files;
create policy vault_files_insert_owner
  on public.vault_files
  for insert
  to authenticated
  with check (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

drop policy if exists vault_files_update_owner on public.vault_files;
create policy vault_files_update_owner
  on public.vault_files
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

drop policy if exists vault_files_delete_owner on public.vault_files;
create policy vault_files_delete_owner
  on public.vault_files
  for delete
  to authenticated
  using (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

-- Objects live at {owner_id}/{file_id}/{filename}. The first folder must be
-- the owner id, and the caller must be that same user.
drop policy if exists company_vault_select_owner on storage.objects;
create policy company_vault_select_owner
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'company-vault'
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (storage.foldername(name))[1] = '651904dd-e516-42cb-934a-93603744deef'
  );

drop policy if exists company_vault_insert_owner on storage.objects;
create policy company_vault_insert_owner
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'company-vault'
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (storage.foldername(name))[1] = '651904dd-e516-42cb-934a-93603744deef'
  );

drop policy if exists company_vault_update_owner on storage.objects;
create policy company_vault_update_owner
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'company-vault'
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (storage.foldername(name))[1] = '651904dd-e516-42cb-934a-93603744deef'
  )
  with check (
    bucket_id = 'company-vault'
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (storage.foldername(name))[1] = '651904dd-e516-42cb-934a-93603744deef'
  );

drop policy if exists company_vault_delete_owner on storage.objects;
create policy company_vault_delete_owner
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'company-vault'
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (storage.foldername(name))[1] = '651904dd-e516-42cb-934a-93603744deef'
  );

-- Seed the starter folders when the owner account already exists.
-- The page also inserts any that are missing on first open.
insert into public.vault_folders (owner_id, name)
select '651904dd-e516-42cb-934a-93603744deef'::uuid, seed.name
from (
  values
    ('Company Registration (CIPC)'),
    ('SARS & Tax'),
    ('B-BBEE'),
    ('Banking'),
    ('Tenders & CSD'),
    ('Contracts & Proposals'),
    ('Invoices & Finance'),
    ('Brand Assets'),
    ('Client Files')
) as seed (name)
where exists (
  select 1
  from auth.users
  where id = '651904dd-e516-42cb-934a-93603744deef'::uuid
)
on conflict do nothing;

comment on table public.vault_folders is 'Owner-only company vault folders.';
comment on table public.vault_files is 'Owner-only company vault file metadata. Bytes live in the private company-vault bucket.';
