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

create table if not exists squads (
  id text primary key check (id in ('a1', 'a3')),
  code text not null unique check (code in ('A1', 'A3')),
  name_es text not null,
  name_en text not null,
  sort_order integer not null default 99,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into squads (id, code, name_es, name_en, sort_order, is_default, is_active)
values
  ('a1', 'A1', 'Comunicaciones A1', 'Comunicaciones A1', 1, true, true),
  ('a3', 'A3', 'Comunicaciones A3', 'Comunicaciones A3', 2, false, true)
on conflict (id) do update
set
  code = excluded.code,
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  sort_order = excluded.sort_order,
  is_default = excluded.is_default,
  is_active = excluded.is_active;

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
  jersey_number integer not null default 0,
  position text not null default 'UTIL',
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

create table if not exists player_assignments (
  player_id uuid not null references players(id) on delete cascade,
  season_id text not null references seasons(id) on delete cascade,
  squad_id text not null references squads(id) on delete cascade,
  jersey_number integer not null default 0,
  position text not null default 'UTIL',
  featured boolean not null default false,
  roster_order integer not null default 99,
  status text not null check (status in ('draft', 'published')) default 'draft',
  primary key (player_id, season_id, squad_id)
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
  saves integer
);

alter table if exists player_season_stats
  add column if not exists squad_id text;

update player_season_stats
set squad_id = 'a1'
where squad_id is null;

alter table if exists player_season_stats
  alter column squad_id set not null;

do $$
begin
  begin
    alter table player_season_stats drop constraint player_season_stats_pkey;
  exception
    when undefined_object then null;
  end;
end $$;

alter table if exists player_season_stats
  add constraint player_season_stats_pkey primary key (player_id, season_id, squad_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'player_season_stats_squad_id_fkey'
  ) then
    alter table player_season_stats
      add constraint player_season_stats_squad_id_fkey
      foreign key (squad_id) references squads(id) on delete cascade;
  end if;
end $$;

create table if not exists team_season_stats (
  season_id text not null references seasons(id) on delete cascade,
  wins integer not null default 0,
  losses integer not null default 0,
  runs_scored integer not null default 0,
  runs_allowed integer not null default 0,
  streak text,
  standing text
);

alter table if exists team_season_stats
  add column if not exists squad_id text;

update team_season_stats
set squad_id = 'a1'
where squad_id is null;

alter table if exists team_season_stats
  alter column squad_id set not null;

do $$
begin
  begin
    alter table team_season_stats drop constraint team_season_stats_pkey;
  exception
    when undefined_object then null;
  end;
end $$;

alter table if exists team_season_stats
  add constraint team_season_stats_pkey primary key (season_id, squad_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_season_stats_squad_id_fkey'
  ) then
    alter table team_season_stats
      add constraint team_season_stats_squad_id_fkey
      foreign key (squad_id) references squads(id) on delete cascade;
  end if;
end $$;

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

alter table if exists games
  add column if not exists squad_id text;

update games
set squad_id = 'a1'
where squad_id is null;

alter table if exists games
  alter column squad_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'games_squad_id_fkey'
  ) then
    alter table games
      add constraint games_squad_id_fkey
      foreign key (squad_id) references squads(id) on delete cascade;
  end if;
end $$;

create table if not exists game_translations (
  game_id uuid not null references games(id) on delete cascade,
  locale text not null check (locale in ('es', 'en')),
  headline text not null default '',
  summary text not null default '',
  key_moment text not null default '',
  primary key (game_id, locale)
);

create table if not exists game_batting_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  season_id text not null references seasons(id) on delete cascade,
  squad_id text not null references squads(id) on delete cascade,
  sequence_no integer not null,
  inning_number integer not null check (inning_number >= 1),
  batter_player_id uuid not null references players(id) on delete cascade,
  event_family text not null check (
    event_family in ('hit', 'walk', 'hbp', 'strikeout', 'out', 'error', 'fielder_choice', 'sacrifice')
  ),
  event_code text not null check (
    event_code in ('single', 'double', 'triple', 'home_run', 'bb', 'hbp', 'k', 'go', 'fo', 'lo', 'e', 'fc', 'sf', 'sh', 'dp')
  ),
  hit_zone text check (hit_zone in ('7', '8', '9')),
  fielder_path text,
  outs_before integer not null default 0 check (outs_before between 0 and 2),
  bases_before jsonb not null default '{}'::jsonb,
  runner_advances jsonb not null default '[]'::jsonb,
  rbi_count integer not null default 0 check (rbi_count >= 0),
  runs_scored_count integer not null default 0 check (runs_scored_count >= 0),
  notation text not null default '',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, sequence_no)
);

create index if not exists game_batting_events_game_idx on game_batting_events (game_id, sequence_no);
create index if not exists game_batting_events_season_squad_idx on game_batting_events (season_id, squad_id);

create table if not exists game_opponent_linescore (
  game_id uuid not null references games(id) on delete cascade,
  inning_number integer not null check (inning_number >= 1),
  runs integer not null default 0 check (runs >= 0),
  primary key (game_id, inning_number)
);

create table if not exists game_lineup_entries (
  game_id uuid not null references games(id) on delete cascade,
  batting_order integer not null check (batting_order between 1 and 9),
  player_id uuid not null references players(id) on delete cascade,
  defensive_position text not null default 'DH',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (game_id, batting_order),
  unique (game_id, player_id)
);

create index if not exists game_lineup_entries_game_idx on game_lineup_entries (game_id, batting_order);

create table if not exists game_scoreboards (
  game_id uuid primary key references games(id) on delete cascade,
  comu_abbreviation text not null default 'COMU',
  opponent_abbreviation text not null default 'RIV',
  comu_runs_by_inning jsonb not null default '{}'::jsonb,
  comu_errors integer not null default 0 check (comu_errors >= 0),
  opponent_hits integer not null default 0 check (opponent_hits >= 0),
  opponent_errors integer not null default 0 check (opponent_errors >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists game_scoreboards
  add column if not exists comu_runs_by_inning jsonb not null default '{}'::jsonb;

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

insert into player_assignments (
  player_id,
  season_id,
  squad_id,
  jersey_number,
  position,
  featured,
  roster_order,
  status
)
select
  players.id,
  coalesce(player_season_stats.season_id, active_season.id, 'season-2026'),
  'a1',
  players.jersey_number,
  players.position,
  players.featured,
  players.roster_order,
  players.status
from players
left join lateral (
  select season_id
  from player_season_stats
  where player_season_stats.player_id = players.id
  order by season_id desc
  limit 1
) as player_season_stats on true
left join lateral (
  select id
  from seasons
  where is_active = true
  order by year desc
  limit 1
) as active_season on true
on conflict (player_id, season_id, squad_id) do nothing;
