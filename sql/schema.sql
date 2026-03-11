create extension if not exists "pgcrypto";

create table if not exists site_settings (
  id text primary key default 'primary',
  team_name text not null,
  short_name text not null,
  primary_color text not null,
  secondary_color text not null,
  tagline_es text not null,
  tagline_en text not null,
  mission_es text not null,
  mission_en text not null,
  hero_image_url text,
  logo_url text,
  instagram_url text,
  facebook_url text,
  x_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists seasons (
  id text primary key,
  year integer not null unique,
  label text not null,
  is_active boolean not null default false,
  starts_at date,
  ends_at date
);

create table if not exists admins (
  user_id uuid primary key,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  first_name text not null,
  last_name text not null,
  jersey_number integer not null,
  position text not null,
  role text not null check (role in ('hitter', 'pitcher', 'two_way')),
  bats text,
  throws text,
  hometown text,
  photo_url text,
  featured boolean not null default false,
  roster_order integer not null default 99,
  status text not null check (status in ('draft', 'published')) default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists player_translations (
  player_id uuid not null references players(id) on delete cascade,
  locale text not null check (locale in ('es', 'en')),
  bio text not null default '',
  spotlight_quote text not null default '',
  primary key (player_id, locale)
);

create table if not exists player_season_stats (
  player_id uuid not null references players(id) on delete cascade,
  season_id text not null references seasons(id) on delete cascade,
  games_played integer not null default 0,
  avg numeric(5, 3),
  obp numeric(5, 3),
  slg numeric(5, 3),
  ops numeric(5, 3),
  home_runs integer,
  runs_batted_in integer,
  runs integer,
  stolen_bases integer,
  wins integer,
  losses integer,
  era numeric(5, 2),
  whip numeric(5, 2),
  strikeouts integer,
  saves integer,
  primary key (player_id, season_id)
);

create table if not exists team_season_stats (
  season_id text primary key references seasons(id) on delete cascade,
  wins integer not null default 0,
  losses integer not null default 0,
  runs_scored integer not null default 0,
  runs_allowed integer not null default 0,
  streak text,
  standing text
);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  season_id text not null references seasons(id) on delete cascade,
  opponent text not null,
  starts_at timestamptz not null,
  venue text not null,
  is_home boolean not null default true,
  status text not null check (status in ('scheduled', 'final', 'postponed')) default 'scheduled',
  home_score integer,
  away_score integer,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists game_translations (
  game_id uuid not null references games(id) on delete cascade,
  locale text not null check (locale in ('es', 'en')),
  headline text not null default '',
  summary text not null default '',
  key_moment text not null default '',
  primary key (game_id, locale)
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  season_id text not null references seasons(id) on delete cascade,
  game_id uuid references games(id) on delete set null,
  kind text not null check (kind in ('news', 'announcement', 'recap')),
  status text not null check (status in ('draft', 'published')) default 'draft',
  published_at timestamptz not null default now(),
  cover_image_url text,
  author_name text not null,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists post_translations (
  post_id uuid not null references posts(id) on delete cascade,
  locale text not null check (locale in ('es', 'en')),
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  primary key (post_id, locale)
);

create table if not exists galleries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  game_id uuid references games(id) on delete set null,
  status text not null check (status in ('draft', 'published')) default 'draft',
  event_date timestamptz not null,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_path text not null unique,
  mime_type text,
  bucket text not null default 'media',
  created_at timestamptz not null default now()
);

create table if not exists gallery_translations (
  gallery_id uuid not null references galleries(id) on delete cascade,
  locale text not null check (locale in ('es', 'en')),
  title text not null,
  description text not null default '',
  primary key (gallery_id, locale)
);

create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  image_url text not null,
  alt_es text not null default '',
  alt_en text not null default '',
  caption_es text not null default '',
  caption_en text not null default '',
  sort_order integer not null default 0
);
