create table if not exists producers (
  id text primary key,
  name text not null,
  village text not null,
  county text not null,
  blurb text not null,
  rating numeric(2,1) not null default 4.8,
  rating_count integer not null default 0,
  km numeric(4,1) not null default 0,
  pickup boolean not null default true,
  delivery boolean not null default true,
  delivery_fee_bani integer not null default 0,
  free_over_bani integer not null default 0,
  min_order_bani integer not null default 0,
  phone text not null default '',
  image text not null default '',
  active boolean not null default true
);

create table if not exists products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null,
  producer_id text not null references producers(id),
  unit text not null,
  price_bani integer not null,
  bulk_qty numeric(10,2),
  bulk_price_bani integer,
  step numeric(10,2) not null default 1,
  stock numeric(10,2) not null default 0,
  image text not null default '',
  blurb text not null default '',
  visible boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0
);

create index if not exists products_category_idx on products (category);
create index if not exists products_producer_idx on products (producer_id);

create table if not exists stories (
  id text primary key,
  slug text not null unique,
  producer_id text not null references producers(id),
  title text not null,
  excerpt text not null,
  body text not null
);

create table if not exists orders (
  id text primary key,
  customer_name text not null,
  customer_phone text not null,
  customer_note text not null default '',
  address text not null default '',
  status text not null default 'noua',
  items_json text not null,
  products_bani integer not null,
  delivery_bani integer not null,
  total_bani integer not null,
  created_at timestamptz not null default now()
);

create index if not exists orders_status_idx on orders (status);
create index if not exists orders_created_idx on orders (created_at desc);

create table if not exists messages (
  id text primary key,
  producer_id text not null references producers(id),
  customer_name text not null,
  customer_phone text not null,
  body text not null,
  created_at timestamptz not null default now()
);
