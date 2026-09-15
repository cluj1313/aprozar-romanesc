create table if not exists app_profile (
  id text primary key,
  name text not null,
  tagline text not null default '',
  cover text not null default '',
  avatar text not null default '',
  phone text not null default ''
);

create table if not exists app_blocks (
  id text primary key,
  title text not null,
  body text not null,
  sort_order integer not null default 0
);

create table if not exists app_apps (
  id text primary key,
  title text not null,
  body text not null default '',
  image text not null default '',
  url text not null default '',
  sort_order integer not null default 0
);

create table if not exists app_visitors (
  visitor_key text primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

alter table announcements add column if not exists image text not null default '';
alter table announcements add column if not exists link_url text not null default '';
