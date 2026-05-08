-- Admin Ghost initial schema
-- Shell Zone owned by Jayden

create extension if not exists "pgcrypto";

-- Clean reset for local/demo development
drop table if exists messages cascade;
drop table if exists quotes cascade;
drop table if exists invoices cascade;
drop table if exists captures cascade;
drop table if exists jobs cascade;
drop table if exists clients cascade;
drop table if exists users cascade;

-- Users / business owners
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  business_name text not null,
  business_type text not null,
  gst_registered boolean not null default false,
  gst_number text,
  created_at timestamptz not null default now()
);

-- Clients/customers
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

-- Jobs
create table jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  location text,
  description text not null,
  status text not null default 'new'
    check (status in ('new', 'quoted', 'approved', 'in_progress', 'completed', 'invoiced', 'paid')),
  labour_hours numeric(8,2),
  materials jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Captures from voice notes, receipts, photos, etc.
create table captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('voice', 'receipt')),
  raw_text text,
  image_url text,
  audio_url text,
  processed boolean not null default false,
  job_id uuid references jobs(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Invoices
create table invoices (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  line_items jsonb not null default '[]'::jsonb,
  labour_total numeric(10,2) not null default 0,
  materials_total numeric(10,2) not null default 0,
  gst numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid')),
  due_date date,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Quotes
create table quotes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  line_items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'declined')),
  expires_at date,
  created_at timestamptz not null default now()
);

-- Drafted/sent messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  type text not null,
  subject text,
  body text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Helpful indexes for dashboard queries
create index idx_clients_user_id on clients(user_id);
create index idx_jobs_user_id on jobs(user_id);
create index idx_jobs_client_id on jobs(client_id);
create index idx_jobs_status on jobs(status);
create index idx_captures_user_id on captures(user_id);
create index idx_captures_job_id on captures(job_id);
create index idx_captures_processed on captures(processed);
create index idx_invoices_job_id on invoices(job_id);
create index idx_invoices_status on invoices(status);
create index idx_quotes_job_id on quotes(job_id);
create index idx_quotes_status on quotes(status);
create index idx_messages_job_id on messages(job_id);

-- Auto-update updated_at on jobs
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger jobs_set_updated_at
before update on jobs
for each row
execute function set_updated_at();