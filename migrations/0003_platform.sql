create table if not exists categories (
  id text primary key,
  label text not null,
  sort_order integer not null default 0
);

create table if not exists site_copy (
  id text primary key,
  body text not null,
  sort_order integer not null default 0
);

create table if not exists announcements (
  id text primary key,
  audience text not null,
  user_id text,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists ads (
  id text primary key,
  producer_id text,
  product_id text,
  title text not null,
  body text not null default '',
  position text not null default 'cart_below',
  orientation text not null default 'horizontal',
  duration_hours integer not null default 72,
  mode text not null default 'static',
  active boolean not null default true,
  image text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists sponsors (
  id text primary key,
  name text not null,
  company text not null default '',
  phone text not null default '',
  email text not null default ''
);

create table if not exists sponsor_payments (
  id text primary key,
  sponsor_id text not null references sponsors(id),
  month_label text not null,
  amount_bani integer not null,
  created_at timestamptz not null default now()
);

create table if not exists sponsor_messages (
  id text primary key,
  sponsor_id text not null references sponsors(id),
  from_admin boolean not null default true,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists shop_people (
  id text primary key,
  name text not null,
  phone text not null default '',
  role text not null,
  producer_id text,
  visits integer not null default 0,
  purchases integer not null default 0,
  warnings integer not null default 0,
  blocked_until timestamptz,
  blocked_forever boolean not null default false
);

create table if not exists moderation_events (
  id text primary key,
  person_id text not null,
  kind text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists faq_pairs (
  id text primary key,
  question text not null,
  answer text not null,
  uses integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists help_tickets (
  id text primary key,
  author_name text not null default '',
  author_phone text not null default '',
  question text not null,
  answer text,
  answered_at timestamptz,
  trained boolean not null default false,
  created_at timestamptz not null default now()
);
