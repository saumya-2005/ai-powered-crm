-- Database schema for the AI CRM
-- Run this once in the Supabase SQL Editor.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  company text,
  source text,
  status text not null default 'New',
  priority text not null default 'Medium',
  notes text,
  ai_score int,
  ai_probability int,
  ai_result jsonb,
  created_at timestamptz default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  type text not null,  -- Call, Email, Meeting, Note, Follow-up
  description text,
  created_at timestamptz default now()
);

create table if not exists follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  title text not null,
  due_date date not null,
  completed boolean default false,
  created_at timestamptz default now()
);

-- Block public access. The app uses the service role key on the server, which bypasses this.
alter table leads enable row level security;
alter table activities enable row level security;
alter table follow_ups enable row level security;