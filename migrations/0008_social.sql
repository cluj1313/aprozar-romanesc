alter table producers add column if not exists social_intro text not null default '';
alter table producers add column if not exists social_facebook text not null default '';
alter table producers add column if not exists social_instagram text not null default '';
alter table producers add column if not exists social_youtube text not null default '';
alter table producers add column if not exists social_tiktok text not null default '';
alter table producers add column if not exists social_website text not null default '';

alter table app_profile add column if not exists social_intro text not null default '';
alter table app_profile add column if not exists social_facebook text not null default '';
alter table app_profile add column if not exists social_instagram text not null default '';
alter table app_profile add column if not exists social_youtube text not null default '';
alter table app_profile add column if not exists social_tiktok text not null default '';
alter table app_profile add column if not exists social_website text not null default '';
