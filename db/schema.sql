create table if not exists sheets (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references sheets(id) on delete cascade,
  created_by text not null,
  name text not null,
  email text not null default '',
  phone text not null default '',
  company text not null default '',
  status text not null default 'Called',
  callback_date date,
  comments text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists sheet_members (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references sheets(id) on delete cascade,
  user_id text not null,
  email text not null,
  role text not null check (role in ('read', 'write')),
  created_at timestamptz not null default now(),
  unique (sheet_id, user_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references sheets(id) on delete cascade,
  user_id text not null,
  user_email text not null,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id text primary key,
  avatar_data text not null,
  avatar_mime text not null,
  updated_at timestamptz not null default now()
);

create index if not exists leads_sheet_id_idx on leads (sheet_id);
create index if not exists sheet_members_user_id_idx on sheet_members (user_id);
create index if not exists notifications_user_id_idx on notifications (user_id);
create index if not exists logs_sheet_id_idx on logs (sheet_id);
