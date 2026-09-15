alter table ads add column if not exists status text not null default 'live';
alter table ads add column if not exists live_at timestamptz;
alter table ads add column if not exists reject_reason text not null default '';

update ads
set live_at = created_at
where live_at is null and status = 'live';
