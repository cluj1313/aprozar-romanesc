alter table announcements add column if not exists hidden boolean not null default false;
alter table messages add column if not exists hidden boolean not null default false;
alter table sponsor_messages add column if not exists hidden boolean not null default false;
alter table help_tickets add column if not exists hidden boolean not null default false;
