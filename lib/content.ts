import {
  galleries as seedGalleries,
  games as seedGames,
  players as seedPlayers,
  posts as seedPosts,
  seasons as seedSeasons,
  siteSettings as seedSiteSettings,
  squads as seedSquads,
  teamStats as seedTeamStats,
  teamStatsBySquad as seedTeamStatsBySquad
} from "@/data/site-content";
import { formatDate, getDictionary } from "@/lib/i18n";
import {
  buildGameScoringSnapshot,
  deriveGameBattingBoxScore,
  deriveGameHitTotal,
  deriveRunsByInning
} from "@/lib/scorebook";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  BaseState,
  Gallery,
  GameBattingEvent,
  GameBattingBoxLine,
  GameScoringSnapshot,
  Game,
  GameLineupEntry,
  GameScoreboard,
  OpponentInningLine,
  Locale,
  LocaleContent,
  Player,
  PlayerAssignment,
  PlayerSeasonStats,
  Post,
  Season,
  SiteData,
  SiteSettings,
  Squad,
  SquadId,
  TeamSeasonStats
} from "@/lib/types";

type TranslationRow = {
  locale: Locale;
};

type SquadRow = {
  id: string;
  code: string;
  name_es: string;
  name_en: string;
  sort_order: number | null;
  is_default: boolean | null;
  is_active: boolean | null;
};

type PlayerAssignmentRow = {
  season_id: string;
  squad_id: SquadId;
  jersey_number: number;
  position: string;
  featured: boolean;
  roster_order: number;
  status: Player["assignment"]["status"];
};

type PlayerStatsRow = {
  season_id: string;
  squad_id: SquadId | null;
  games_played: number;
  avg: number | null;
  obp: number | null;
  slg: number | null;
  ops: number | null;
  home_runs: number | null;
  runs_batted_in: number | null;
  runs: number | null;
  stolen_bases: number | null;
  wins: number | null;
  losses: number | null;
  era: number | null;
  whip: number | null;
  strikeouts: number | null;
  saves: number | null;
};

type PlayerRow = {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  position: string | null;
  role: Player["role"];
  bats: string | null;
  throws: string | null;
  hometown: string | null;
  status: Player["assignment"]["status"] | null;
  photo_url: string | null;
  featured: boolean | null;
  roster_order: number | null;
  player_translations?: Array<
    TranslationRow & {
      bio: string;
      spotlight_quote: string;
    }
  >;
  player_assignments?: PlayerAssignmentRow[];
  player_season_stats?: PlayerStatsRow[];
};

type GameRow = {
  id: string;
  slug: string;
  season_id: string;
  squad_id: SquadId | null;
  opponent: string;
  starts_at: string;
  venue: string;
  is_home: boolean;
  status: Game["status"];
  home_score: number | null;
  away_score: number | null;
  cover_image_url: string | null;
  game_translations?: Array<
    TranslationRow & {
      headline: string;
      summary: string;
      key_moment: string;
    }
  >;
};

type GameBattingEventRow = {
  id: string;
  game_id: string;
  season_id: string;
  squad_id: SquadId | null;
  sequence_no: number;
  inning_number: number;
  batter_player_id: string;
  event_family: GameBattingEvent["eventFamily"];
  event_code: GameBattingEvent["eventCode"];
  hit_zone: string | null;
  fielder_path: string | null;
  outs_before: number;
  bases_before: BaseState | null;
  runner_advances: GameBattingEvent["runnerAdvances"] | null;
  rbi_count: number;
  runs_scored_count: number;
  notation: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type OpponentInningLineRow = {
  game_id: string;
  inning_number: number;
  runs: number;
};

type GameLineupEntryRow = {
  game_id: string;
  batting_order: number;
  player_id: string;
  defensive_position: string;
};

type GameScoreboardRow = {
  game_id: string;
  comu_abbreviation: string;
  opponent_abbreviation: string;
  comu_errors: number;
  opponent_hits: number;
  opponent_errors: number;
};

type PostRow = {
  id: string;
  slug: string;
  season_id: string;
  kind: Post["kind"];
  status: Post["status"];
  published_at: string;
  cover_image_url: string | null;
  author_name: string;
  is_featured: boolean;
  post_translations?: Array<
    TranslationRow & {
      title: string;
      excerpt: string;
      body: string;
    }
  >;
};

type GalleryRow = {
  id: string;
  slug: string;
  status: Gallery["status"];
  event_date: string;
  cover_image_url: string | null;
  gallery_translations?: Array<
    TranslationRow & {
      title: string;
      description: string;
    }
  >;
  gallery_images?: Array<{
    id: string;
    image_url: string;
    alt_es: string;
    alt_en: string;
    caption_es: string;
    caption_en: string;
    sort_order: number;
  }>;
};

type TeamStatsRow = {
  season_id: string;
  squad_id: SquadId | null;
  wins: number;
  losses: number;
  runs_scored: number;
  runs_allowed: number;
  streak: string | null;
  standing: string | null;
};

function toLocaleContent<T extends TranslationRow>(
  rows: T[] | undefined,
  pick: (row: T) => string,
  fallback: LocaleContent = { es: "", en: "" }
): LocaleContent {
  if (!rows?.length) {
    return fallback;
  }

  const es = rows.find((row) => row.locale === "es");
  const en = rows.find((row) => row.locale === "en");

  return {
    es: es ? pick(es) : fallback.es,
    en: en ? pick(en) : es ? pick(es) : fallback.en
  };
}

function toSquadId(input: string | null | undefined): SquadId {
  return input === "a3" ? "a3" : "a1";
}

function mapSiteSettings(row: Record<string, unknown> | null | undefined): SiteSettings {
  if (!row) {
    return seedSiteSettings;
  }

  return {
    teamName: String(row.team_name || seedSiteSettings.teamName),
    shortName: String(row.short_name || seedSiteSettings.shortName),
    primaryColor: String(row.primary_color || seedSiteSettings.primaryColor),
    secondaryColor: String(row.secondary_color || seedSiteSettings.secondaryColor),
    tagline: {
      es: String(row.tagline_es || seedSiteSettings.tagline.es),
      en: String(row.tagline_en || row.tagline_es || seedSiteSettings.tagline.en)
    },
    mission: {
      es: String(row.mission_es || seedSiteSettings.mission.es),
      en: String(row.mission_en || row.mission_es || seedSiteSettings.mission.en)
    },
    heroImage: String(row.hero_image_url || seedSiteSettings.heroImage),
    logoMark: String(row.logo_url || seedSiteSettings.logoMark),
    socialLinks: {
      instagram: (row.instagram_url as string | undefined) || undefined,
      facebook: (row.facebook_url as string | undefined) || undefined,
      x: (row.x_url as string | undefined) || undefined
    }
  };
}

function mapSquads(rows: SquadRow[] | null | undefined): Squad[] {
  if (!rows?.length) {
    return seedSquads;
  }

  return rows.map((row) => ({
    id: toSquadId(row.id),
    code: row.code === "A3" ? "A3" : "A1",
    name: {
      es: row.name_es || row.code,
      en: row.name_en || row.name_es || row.code
    },
    isDefault: Boolean(row.is_default),
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order ?? 99)
  }));
}

function mapTeamStatsList(rows: TeamStatsRow[] | null | undefined): TeamSeasonStats[] {
  if (!rows?.length) {
    return seedTeamStatsBySquad;
  }

  return rows.map((row) => ({
    seasonId: row.season_id,
    squadId: toSquadId(row.squad_id),
    wins: Number(row.wins || 0),
    losses: Number(row.losses || 0),
    runsScored: Number(row.runs_scored || 0),
    runsAllowed: Number(row.runs_allowed || 0),
    streak: String(row.streak || ""),
    standing: row.standing ? String(row.standing) : undefined
  }));
}

function mapPlayerStats(row?: PlayerStatsRow, assignment?: PlayerAssignment): PlayerSeasonStats {
  if (!row) {
    return {
      seasonId: assignment?.seasonId || seedTeamStats.seasonId,
      squadId: assignment?.squadId || seedTeamStats.squadId,
      gamesPlayed: 0
    };
  }

  return {
    seasonId: row.season_id,
    squadId: toSquadId(row.squad_id || assignment?.squadId),
    gamesPlayed: row.games_played,
    avg: row.avg ?? undefined,
    obp: row.obp ?? undefined,
    slg: row.slg ?? undefined,
    ops: row.ops ?? undefined,
    homeRuns: row.home_runs ?? undefined,
    runsBattedIn: row.runs_batted_in ?? undefined,
    runs: row.runs ?? undefined,
    stolenBases: row.stolen_bases ?? undefined,
    wins: row.wins ?? undefined,
    losses: row.losses ?? undefined,
    era: row.era ?? undefined,
    whip: row.whip ?? undefined,
    strikeouts: row.strikeouts ?? undefined,
    saves: row.saves ?? undefined
  };
}

function buildLegacyAssignment(row: PlayerRow): PlayerAssignment {
  return {
    seasonId: row.player_season_stats?.[0]?.season_id || seedTeamStats.seasonId,
    squadId: "a1",
    jerseyNumber: Number(row.jersey_number || 0),
    position: row.position || "UTIL",
    featured: Boolean(row.featured),
    rosterOrder: Number(row.roster_order ?? 99),
    status: row.status || "draft"
  };
}

function mapPlayers(rows: PlayerRow[] | null | undefined): Player[] {
  if (!rows?.length) {
    return seedPlayers;
  }

  const mapped = rows.flatMap((row) => {
    const assignments = row.player_assignments?.length
      ? row.player_assignments.map<PlayerAssignment>((assignment) => ({
          seasonId: assignment.season_id,
          squadId: toSquadId(assignment.squad_id),
          jerseyNumber: assignment.jersey_number,
          position: assignment.position,
          featured: assignment.featured,
          rosterOrder: assignment.roster_order,
          status: assignment.status
        }))
      : [buildLegacyAssignment(row)];

    return assignments.map((assignment) => {
      const statsRow = row.player_season_stats?.find(
        (item) =>
          item.season_id === assignment.seasonId &&
          toSquadId(item.squad_id || assignment.squadId) === assignment.squadId
      );

      return {
        id: row.id,
        slug: row.slug,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        bats: row.bats ?? undefined,
        throws: row.throws ?? undefined,
        hometown: row.hometown ?? undefined,
        photo: row.photo_url || seedPlayers[0]?.photo || "",
        bio: toLocaleContent(row.player_translations, (item) => item.bio),
        spotlightQuote: toLocaleContent(
          row.player_translations,
          (item) => item.spotlight_quote,
          { es: "", en: "" }
        ),
        assignment,
        stats: mapPlayerStats(statsRow, assignment)
      } satisfies Player;
    });
  });

  return mapped.length ? mapped : seedPlayers;
}

function mapGames(rows: GameRow[] | null | undefined): Game[] {
  if (!rows?.length) {
    return seedGames;
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    seasonId: row.season_id,
    squadId: toSquadId(row.squad_id),
    opponent: row.opponent,
    startsAt: row.starts_at,
    venue: row.venue,
    isHome: row.is_home,
    status: row.status,
    homeScore: row.home_score ?? undefined,
    awayScore: row.away_score ?? undefined,
    coverImage: row.cover_image_url || seedGames[0]?.coverImage || "",
    headline: toLocaleContent(row.game_translations, (item) => item.headline),
    summary: toLocaleContent(row.game_translations, (item) => item.summary),
    keyMoment: toLocaleContent(row.game_translations, (item) => item.key_moment),
    gallerySlug: undefined
  }));
}

function mapGameBattingEvents(rows: GameBattingEventRow[] | null | undefined): GameBattingEvent[] {
  if (!rows?.length) {
    return [];
  }

  return rows
    .sort((a, b) => a.sequence_no - b.sequence_no)
    .map((row) => ({
      id: row.id,
      gameId: row.game_id,
      seasonId: row.season_id,
      squadId: toSquadId(row.squad_id),
      sequenceNo: row.sequence_no,
      inningNumber: row.inning_number,
      batterPlayerId: row.batter_player_id,
      eventFamily: row.event_family,
      eventCode: row.event_code,
      hitZone: row.hit_zone === "7" || row.hit_zone === "8" || row.hit_zone === "9" ? row.hit_zone : undefined,
      fielderPath: row.fielder_path ?? undefined,
      outsBefore: row.outs_before,
      basesBefore: row.bases_before ?? {},
      runnerAdvances: Array.isArray(row.runner_advances) ? row.runner_advances : [],
      rbiCount: row.rbi_count,
      runsScoredCount: row.runs_scored_count,
      notation: row.notation,
      notes: row.notes ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
}

function mapOpponentLines(rows: OpponentInningLineRow[] | null | undefined): OpponentInningLine[] {
  if (!rows?.length) {
    return [];
  }

  return rows
    .sort((a, b) => a.inning_number - b.inning_number)
    .map((row) => ({
      gameId: row.game_id,
      inningNumber: row.inning_number,
      runs: row.runs
    }));
}

function mapLineupEntries(rows: GameLineupEntryRow[] | null | undefined): GameLineupEntry[] {
  if (!rows?.length) {
    return [];
  }

  return rows
    .sort((a, b) => a.batting_order - b.batting_order)
    .map((row) => ({
      gameId: row.game_id,
      battingOrder: row.batting_order,
      playerId: row.player_id,
      defensivePosition: row.defensive_position
    }));
}

function mapScoreboard(row: GameScoreboardRow | null | undefined, gameId: string, opponent: string) {
  return {
    gameId,
    comuAbbreviation: row?.comu_abbreviation || "COMU",
    opponentAbbreviation: row?.opponent_abbreviation || opponent.slice(0, 3).toUpperCase(),
    comuErrors: Number(row?.comu_errors ?? 0),
    opponentHits: Number(row?.opponent_hits ?? 0),
    opponentErrors: Number(row?.opponent_errors ?? 0)
  } satisfies GameScoreboard;
}

function mapPosts(rows: PostRow[] | null | undefined): Post[] {
  if (!rows?.length) {
    return seedPosts;
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    seasonId: row.season_id,
    kind: row.kind,
    status: row.status,
    publishedAt: row.published_at,
    coverImage: row.cover_image_url || seedPosts[0]?.coverImage || "",
    authorName: row.author_name,
    featured: row.is_featured,
    title: toLocaleContent(row.post_translations, (item) => item.title),
    excerpt: toLocaleContent(row.post_translations, (item) => item.excerpt),
    body: toLocaleContent(row.post_translations, (item) => item.body)
  }));
}

function mapGalleries(rows: GalleryRow[] | null | undefined): Gallery[] {
  if (!rows?.length) {
    return seedGalleries;
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    status: row.status,
    eventDate: row.event_date,
    coverImage: row.cover_image_url || seedGalleries[0]?.coverImage || "",
    title: toLocaleContent(row.gallery_translations, (item) => item.title),
    description: toLocaleContent(row.gallery_translations, (item) => item.description),
    images: (row.gallery_images || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        id: image.id,
        image: image.image_url,
        alt: {
          es: image.alt_es,
          en: image.alt_en || image.alt_es
        },
        caption:
          image.caption_es || image.caption_en
            ? {
                es: image.caption_es,
                en: image.caption_en || image.caption_es
              }
            : undefined,
        order: image.sort_order
      }))
  }));
}

export function resolveSelectedSquad(requested: string | undefined, squads: Squad[]) {
  const activeSquads = squads.filter((squad) => squad.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const fallback =
    activeSquads.find((squad) => squad.isDefault) ?? activeSquads[0] ?? seedSquads[0];

  return activeSquads.find((squad) => squad.id === requested) ?? fallback;
}

function getTeamStatsForSquad(items: TeamSeasonStats[], seasonId: string, squadId: SquadId) {
  return (
    items.find((item) => item.seasonId === seasonId && item.squadId === squadId) ??
    seedTeamStatsBySquad.find((item) => item.seasonId === seasonId && item.squadId === squadId) ??
    seedTeamStatsBySquad.find((item) => item.squadId === squadId) ?? {
      seasonId,
      squadId,
      wins: 0,
      losses: 0,
      runsScored: 0,
      runsAllowed: 0,
      streak: "0",
      standing: undefined
    }
  );
}

function filterPlayersBySquad(players: Player[], squadId: SquadId) {
  return players.filter((player) => player.assignment.squadId === squadId);
}

function filterGamesBySquad(games: Game[], squadId: SquadId) {
  return games.filter((game) => game.squadId === squadId);
}

async function loadFromSupabase() {
  const client = createAdminClient();
  if (!client) {
    return null;
  }

  const [
    settingsResult,
    seasonsResult,
    squadsResult,
    statsResult,
    playersResult,
    gamesResult,
    postsResult,
    galleriesResult
  ] = await Promise.all([
    client.from("site_settings").select("*").eq("id", "primary").maybeSingle(),
    client.from("seasons").select("*").order("year", { ascending: false }),
    client.from("squads").select("*").order("sort_order", { ascending: true }),
    client.from("team_season_stats").select("*"),
    client
      .from("players")
      .select(
        "id, slug, first_name, last_name, jersey_number, position, role, bats, throws, hometown, status, photo_url, featured, roster_order, player_translations(locale, bio, spotlight_quote), player_assignments(season_id, squad_id, jersey_number, position, featured, roster_order, status), player_season_stats(season_id, squad_id, games_played, avg, obp, slg, ops, home_runs, runs_batted_in, runs, stolen_bases, wins, losses, era, whip, strikeouts, saves)"
      ),
    client
      .from("games")
      .select(
        "id, slug, season_id, squad_id, opponent, starts_at, venue, is_home, status, home_score, away_score, cover_image_url, game_translations(locale, headline, summary, key_moment)"
      )
      .order("starts_at", { ascending: true }),
    client
      .from("posts")
      .select(
        "id, slug, season_id, kind, status, published_at, cover_image_url, author_name, is_featured, post_translations(locale, title, excerpt, body)"
      )
      .order("published_at", { ascending: false }),
    client
      .from("galleries")
      .select(
        "id, slug, status, event_date, cover_image_url, gallery_translations(locale, title, description), gallery_images(id, image_url, alt_es, alt_en, caption_es, caption_en, sort_order)"
      )
      .order("event_date", { ascending: false })
  ]);

  const hasError =
    settingsResult.error ||
    seasonsResult.error ||
    squadsResult.error ||
    statsResult.error ||
    playersResult.error ||
    gamesResult.error ||
    postsResult.error ||
    galleriesResult.error;

  if (hasError) {
    return null;
  }

  const mappedSeasons: Season[] =
    seasonsResult.data?.map((row) => ({
      id: String(row.id),
      year: Number(row.year),
      label: String(row.label),
      active: Boolean(row.is_active)
    })) || seedSeasons;

  const mappedSquads = mapSquads(squadsResult.data as SquadRow[] | null | undefined);
  const teamStatsBySquad = mapTeamStatsList(statsResult.data as TeamStatsRow[] | null | undefined);
  const activeSeason =
    mappedSeasons.find((season) => season.active) ??
    mappedSeasons[0] ??
    seedSeasons.find((season) => season.active) ??
    seedSeasons[0];
  const defaultSquad = resolveSelectedSquad(undefined, mappedSquads);

  return {
    settings: mapSiteSettings(settingsResult.data),
    seasons: mappedSeasons.length ? mappedSeasons : seedSeasons,
    activeSeason,
    squads: mappedSquads.length ? mappedSquads : seedSquads,
    defaultSquad,
    teamStats: getTeamStatsForSquad(teamStatsBySquad, activeSeason.id, defaultSquad.id),
    teamStatsBySquad,
    players: mapPlayers(playersResult.data as PlayerRow[] | null | undefined),
    games: mapGames(gamesResult.data as GameRow[] | null | undefined),
    posts: mapPosts(postsResult.data as PostRow[] | null | undefined),
    galleries: mapGalleries(galleriesResult.data as GalleryRow[] | null | undefined)
  } satisfies SiteData;
}

export async function getSiteData(): Promise<SiteData> {
  if (isSupabaseConfigured()) {
    const remote = await loadFromSupabase();
    if (remote) {
      return remote;
    }
  }

  const defaultSquad = resolveSelectedSquad(undefined, seedSquads);
  const activeSeason = seedSeasons.find((season) => season.active) ?? seedSeasons[0];

  return {
    settings: seedSiteSettings,
    seasons: seedSeasons,
    activeSeason,
    squads: seedSquads,
    defaultSquad,
    teamStats: getTeamStatsForSquad(seedTeamStatsBySquad, activeSeason.id, defaultSquad.id),
    teamStatsBySquad: seedTeamStatsBySquad,
    players: seedPlayers,
    games: seedGames,
    posts: seedPosts,
    galleries: seedGalleries
  };
}

export async function getHomePayload(locale: Locale, squadParam?: string) {
  const data = await getSiteData();
  const dictionary = getDictionary(locale);
  const selectedSquad = resolveSelectedSquad(squadParam, data.squads);
  const squadPlayers = filterPlayersBySquad(data.players, selectedSquad.id);
  const publishedPlayers = squadPlayers.filter((player) => player.assignment.status === "published");
  const squadGames = sortGames(filterGamesBySquad(data.games, selectedSquad.id));
  const nextGame = squadGames.find((game) => game.status === "scheduled");
  const latestResult = [...squadGames]
    .filter((game) => game.status === "final")
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())[0];

  return {
    ...data,
    dictionary,
    selectedSquad,
    teamStats: getTeamStatsForSquad(data.teamStatsBySquad, data.activeSeason.id, selectedSquad.id),
    players: publishedPlayers,
    games: squadGames,
    nextGame,
    latestResult,
    featuredPlayers: publishedPlayers.filter((player) => player.assignment.featured).slice(0, 3),
    featuredPosts: data.posts.filter((post) => post.status === "published").slice(0, 3),
    featuredGalleries: data.galleries.filter((gallery) => gallery.status === "published").slice(0, 2)
  };
}

export async function getRosterPayload(locale: Locale, squadParam?: string) {
  const data = await getSiteData();
  const dictionary = getDictionary(locale);
  const selectedSquad = resolveSelectedSquad(squadParam, data.squads);

  return {
    ...data,
    dictionary,
    selectedSquad,
    players: sortPlayers(
      filterPlayersBySquad(data.players, selectedSquad.id).filter(
        (player) => player.assignment.status === "published"
      )
    )
  };
}

export async function getGamesPayload(locale: Locale, squadParam?: string) {
  const data = await getSiteData();
  const dictionary = getDictionary(locale);
  const selectedSquad = resolveSelectedSquad(squadParam, data.squads);

  return {
    ...data,
    dictionary,
    selectedSquad,
    games: sortGames(filterGamesBySquad(data.games, selectedSquad.id))
  };
}

export async function getPlayerBySlug(slug: string, squadParam?: string) {
  const data = await getSiteData();
  const selectedSquad = resolveSelectedSquad(squadParam, data.squads);

  return (
    filterPlayersBySquad(data.players, selectedSquad.id).find((player) => player.slug === slug) ??
    data.players.find((player) => player.slug === slug)
  );
}

export async function getGameBySlug(slug: string, squadParam?: string) {
  const data = await getSiteData();
  const selectedSquad = resolveSelectedSquad(squadParam, data.squads);

  return (
    filterGamesBySquad(data.games, selectedSquad.id).find((game) => game.slug === slug) ??
    data.games.find((game) => game.slug === slug)
  );
}

export async function getAdminGameScorebookPayload(gameId: string) {
  const data = await getSiteData();
  const game = data.games.find((item) => item.id === gameId);

  if (!game) {
    return null;
  }

  const roster = sortPlayers(
    data.players.filter(
      (player) =>
        player.assignment.squadId === game.squadId &&
        player.assignment.seasonId === game.seasonId
    )
  );

  if (!isSupabaseConfigured()) {
    const comuRunsByInning = deriveRunsByInning([]);
    return {
      game,
      roster,
      lineup: [],
      lineupRoster: roster,
      gameBattingLines: {},
      comuRunsByInning,
      comuHitTotal: deriveGameHitTotal([]),
      scoreboard: mapScoreboard(null, game.id, game.opponent),
      events: [],
      opponentLines: [],
      snapshot: buildGameScoringSnapshot(game, [], [])
    } satisfies {
      game: Game;
      roster: Player[];
      lineup: GameLineupEntry[];
      lineupRoster: Player[];
      gameBattingLines: Record<string, GameBattingBoxLine>;
      comuRunsByInning: Map<number, number>;
      comuHitTotal: number;
      scoreboard: GameScoreboard;
      events: GameBattingEvent[];
      opponentLines: OpponentInningLine[];
      snapshot: GameScoringSnapshot;
    };
  }

  const client = createAdminClient();
  if (!client) {
    return null;
  }

  const [eventsResult, linesResult, lineupResult, scoreboardResult] = await Promise.all([
    client
      .from("game_batting_events")
      .select("*")
      .eq("game_id", gameId)
      .order("sequence_no", { ascending: true }),
    client
      .from("game_opponent_linescore")
      .select("*")
      .eq("game_id", gameId)
      .order("inning_number", { ascending: true }),
    client
      .from("game_lineup_entries")
      .select("*")
      .eq("game_id", gameId)
      .order("batting_order", { ascending: true }),
    client.from("game_scoreboards").select("*").eq("game_id", gameId).maybeSingle()
  ]);

  const events = mapGameBattingEvents(
    (eventsResult.data as GameBattingEventRow[] | null | undefined) ?? []
  );
  const opponentLines = mapOpponentLines(
    (linesResult.data as OpponentInningLineRow[] | null | undefined) ?? []
  );
  const lineup = mapLineupEntries(
    (lineupResult.data as GameLineupEntryRow[] | null | undefined) ?? []
  );
  const lineupRoster =
    lineup.length > 0
      ? lineup
          .map((entry) => roster.find((player) => player.id === entry.playerId))
          .filter((player): player is Player => Boolean(player))
      : roster;
  const gameBattingLines = deriveGameBattingBoxScore(events);
  const comuRunsByInning = deriveRunsByInning(events);
  const comuHitTotal = deriveGameHitTotal(events);
  const scoreboard = mapScoreboard(
    scoreboardResult.data as GameScoreboardRow | null | undefined,
    game.id,
    game.opponent
  );

  return {
    game,
    roster,
    lineup,
    lineupRoster,
    gameBattingLines,
    comuRunsByInning,
    comuHitTotal,
    scoreboard,
    events,
    opponentLines,
    snapshot: buildGameScoringSnapshot(game, events, opponentLines)
  } satisfies {
    game: Game;
    roster: Player[];
    lineup: GameLineupEntry[];
    lineupRoster: Player[];
    gameBattingLines: Record<string, GameBattingBoxLine>;
    comuRunsByInning: Map<number, number>;
    comuHitTotal: number;
    scoreboard: GameScoreboard;
    events: GameBattingEvent[];
    opponentLines: OpponentInningLine[];
    snapshot: GameScoringSnapshot;
  };
}

export async function getPostBySlug(slug: string) {
  const data = await getSiteData();
  return data.posts.find((post) => post.slug === slug);
}

export async function getGalleryBySlug(slug: string) {
  const data = await getSiteData();
  return data.galleries.find((gallery) => gallery.slug === slug);
}

export function localizeText(locale: Locale, input: { es: string; en: string }) {
  return input[locale] || input.es;
}

export function sortPlayers(items: Player[]) {
  return [...items].sort(
    (a, b) =>
      a.assignment.rosterOrder - b.assignment.rosterOrder ||
      a.assignment.jerseyNumber - b.assignment.jerseyNumber
  );
}

export function sortGames(items: Game[]) {
  return [...items].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

export function sortPosts(items: Post[]) {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function sortGalleries(items: Gallery[]) {
  return [...items].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );
}

export function describeGame(locale: Locale, game: Game) {
  return {
    title: localizeText(locale, game.headline),
    summary: localizeText(locale, game.summary),
    when: formatDate(game.startsAt, locale)
  };
}
