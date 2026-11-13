-- Amount paid on the invoice dashboard.
-- Idempotent and additive. Does not update existing invoice or upload rows.
--
-- tracked_amount and marked_paid already exist and are null on the live
-- project (2 invoices, 0 payments, 0 uploads). Their meaning changes in the
-- app only; this file does not rewrite those nulls.
--
--   invoices.tracked_amount  — amount the client has paid, typed on the
--                              dashboard. Null keeps using the payments sum.
--                              It is not an invoice total.
--   invoices.marked_paid     — true only while the Paid toggle is forcing the
--                              full invoice total. The typed amount is kept.
--   invoice_uploads.amount   — invoice total for a file (already the column).
--   invoice_uploads.amount_paid — amount the client has paid toward that file.
--   invoice_uploads.paid     — same forced-full-payment flag as marked_paid.
--
-- The payments table is not used for this running figure. Its amount must be
-- greater than zero, and the sum of those rows is what finalises an issued
-- invoice. The owner needs to set the running amount up or down (R500, later
-- R1450, later back) without deleting real payment rows. Each dashboard
-- change is appended to invoice_paid_events instead.
--
-- Apply in the Supabase SQL editor (project maofytcvzlapcqegrvpp) or with
-- `supabase db query --linked -f supabase/migrations/20261113131500_invoice_amount_paid.sql`.
-- The owner id must stay the same as OWNER_ID in js/supabase-client.js.
-- This migration is not applied by the pull request that adds it.

alter table public.invoice_uploads
  add column if not exists amount_paid numeric(12,2) not null default 0;

do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'invoice_uploads_amount_paid_check'
      and conrelid = 'public.invoice_uploads'::regclass
  ) then
    alter table public.invoice_uploads
      add constraint invoice_uploads_amount_paid_check
      check (amount_paid >= 0 and amount_paid <= 100000000);
  end if;
end
$do$;

comment on column public.invoices.tracked_amount is
  'Dashboard amount paid in ZAR. Null uses the sum of payment rows. Not an invoice total. Null on existing rows when this meaning was adopted.';
comment on column public.invoices.marked_paid is
  'True while the dashboard Paid toggle forces the full invoice total. The typed amount in tracked_amount is kept and restored when the toggle is cleared.';
comment on column public.invoice_uploads.amount is
  'Invoice total in ZAR for an uploaded file.';
comment on column public.invoice_uploads.amount_paid is
  'Amount the client has paid toward this uploaded invoice. The Paid toggle does not erase it.';
comment on column public.invoice_uploads.paid is
  'True while the Paid toggle forces this uploaded invoice to count as fully paid.';

create table if not exists public.invoice_paid_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invoice_id uuid references public.invoices (id) on delete cascade,
  upload_id uuid references public.invoice_uploads (id) on delete cascade,
  amount numeric(12,2) not null,
  delta numeric(12,2) not null default 0,
  kind text not null default 'edit',
  created_at timestamptz not null default now(),
  constraint invoice_paid_events_one_target check ((invoice_id is not null) <> (upload_id is not null)),
  constraint invoice_paid_events_amount_check check (amount >= 0 and amount <= 100000000),
  constraint invoice_paid_events_kind_check check (kind in ('edit', 'marked_paid', 'marked_unpaid'))
);

create index if not exists invoice_paid_events_owner_created_idx
  on public.invoice_paid_events (owner_id, created_at desc);

create index if not exists invoice_paid_events_invoice_idx
  on public.invoice_paid_events (invoice_id)
  where invoice_id is not null;

create index if not exists invoice_paid_events_upload_idx
  on public.invoice_paid_events (upload_id)
  where upload_id is not null;

alter table public.invoice_paid_events enable row level security;

revoke all on table public.invoice_paid_events from anon, authenticated, public;
grant select, insert on table public.invoice_paid_events to authenticated;

drop policy if exists invoice_paid_events_select_owner on public.invoice_paid_events;
create policy invoice_paid_events_select_owner
  on public.invoice_paid_events
  for select
  to authenticated
  using (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

drop policy if exists invoice_paid_events_insert_owner on public.invoice_paid_events;
create policy invoice_paid_events_insert_owner
  on public.invoice_paid_events
  for insert
  to authenticated
  with check (
    owner_id = '651904dd-e516-42cb-934a-93603744deef'::uuid
    and (select auth.uid()) = '651904dd-e516-42cb-934a-93603744deef'::uuid
  );

comment on table public.invoice_paid_events is
  'Append-only history of the dashboard amount-paid figure. amount is the running total after the change. delta is the difference from the previous figure.';
