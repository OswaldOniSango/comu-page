import {
  galleries as seedGalleries,
  games as seedGames,
  players as seedPlayers,
  posts as seedPosts,
  seasons as seedSeasons,
  siteSettings as seedSiteSettings,
  teamStats as seedTeamStats
} from "@/data/site-content";
import { formatDate, getDictionary } from "@/lib/i18n";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  Gallery,
  Game,
  Locale,
  LocaleContent,
  Player,
  PlayerSeasonStats,
  Post,
  Season,
  SiteSettings,
  TeamSeasonStats
} from "@/lib/types";

type TranslationRow = {
  locale: Locale;
};

type PlayerRow = {
  id: string;
  slug: string;
  first_name: string;
  last_name: string;
  jersey_number: number;
  position: string;
  role: Player["role"];
  bats: string | null;
  throws: string | null;
  hometown: string | null;
  status: Player["status"];
  photo_url: string | null;
  featured: boolean;
  roster_order: number;
  player_translations?: Array<
    TranslationRow & {
      bio: string;
      spotlight_quote: string;
    }
  >;
  player_season_stats?: PlayerStatsRow[];
};

type PlayerStatsRow = {
  season_id: string;
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

type GameRow = {
  id: string;
  slug: string;
  season_id: string;
  opponent: string;
  starts_at: string;
  venue: string;
  is_home: boolean;
  status: Game["status"];
  home_score: number | null;
  away_score: number | null;
  cover_image_url: string | null;
  gallery_id?: string | null;
  game_translations?: Array<
    TranslationRow & {
      headline: string;
      summary: string;
      key_moment: string;
    }
  >;
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

function mapTeamStats(row: Record<string, unknown> | null | undefined): TeamSeasonStats {
  if (!row) {
    return seedTeamStats;
  }

  return {
    seasonId: String(row.season_id || seedTeamStats.seasonId),
    wins: Number(row.wins || 0),
    losses: Number(row.losses || 0),
    runsScored: Number(row.runs_scored || 0),
    runsAllowed: Number(row.runs_allowed || 0),
    streak: String(row.streak || ""),
    standing: row.standing ? String(row.standing) : undefined
  };
}

function mapPlayerStats(row?: PlayerStatsRow): PlayerSeasonStats {
  if (!row) {
    return {
      seasonId: seedTeamStats.seasonId,
      gamesPlayed: 0
    };
  }

  return {
    seasonId: row.season_id,
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

function mapPlayers(rows: PlayerRow[] | null | undefined): Player[] {
  if (!rows?.length) {
    return seedPlayers;
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    firstName: row.first_name,
    lastName: row.last_name,
    jerseyNumber: row.jersey_number,
    position: row.position,
    role: row.role,
    bats: row.bats ?? undefined,
    throws: row.throws ?? undefined,
    hometown: row.hometown ?? undefined,
    status: row.status,
    photo: row.photo_url || seedPlayers[0]?.photo || "",
    featured: row.featured,
    rosterOrder: row.roster_order,
    bio: toLocaleContent(row.player_translations, (item) => item.bio),
    spotlightQuote: toLocaleContent(
      row.player_translations,
      (item) => item.spotlight_quote,
      { es: "", en: "" }
    ),
    stats: mapPlayerStats(row.player_season_stats?.[0])
  }));
}

function mapGames(rows: GameRow[] | null | undefined): Game[] {
  if (!rows?.length) {
    return seedGames;
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    seasonId: row.season_id,
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

async function loadFromSupabase() {
  const client = createAdminClient();
  if (!client) {
    return null;
  }

  const [
    settingsResult,
    seasonsResult,
    statsResult,
    playersResult,
    gamesResult,
    postsResult,
    galleriesResult
  ] = await Promise.all([
    client.from("site_settings").select("*").eq("id", "primary").maybeSingle(),
    client.from("seasons").select("*").order("year", { ascending: false }),
    client.from("team_season_stats").select("*").limit(1).maybeSingle(),
    client
      .from("players")
      .select(
        "id, slug, first_name, last_name, jersey_number, position, role, bats, throws, hometown, status, photo_url, featured, roster_order, player_translations(locale, bio, spotlight_quote), player_season_stats(season_id, games_played, avg, obp, slg, ops, home_runs, runs_batted_in, runs, stolen_bases, wins, losses, era, whip, strikeouts, saves)"
      )
      .order("roster_order", { ascending: true }),
    client
      .from("games")
      .select(
        "id, slug, season_id, opponent, starts_at, venue, is_home, status, home_score, away_score, cover_image_url, game_translations(locale, headline, summary, key_moment)"
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

  const mappedPlayers = mapPlayers(playersResult.data as PlayerRow[] | null | undefined);
  const mappedGames = mapGames(gamesResult.data as GameRow[] | null | undefined);
  const mappedPosts = mapPosts(postsResult.data as PostRow[] | null | undefined);
  const mappedGalleries = mapGalleries(galleriesResult.data as GalleryRow[] | null | undefined);

  if (
    !mappedSeasons.length &&
    !mappedPlayers.length &&
    !mappedGames.length &&
    !mappedPosts.length &&
    !mappedGalleries.length
  ) {
    return null;
  }

  return {
    settings: mapSiteSettings(settingsResult.data),
    seasons: mappedSeasons.length ? mappedSeasons : seedSeasons,
    activeSeason:
      mappedSeasons.find((season) => season.active) ??
      mappedSeasons[0] ??
      seedSeasons.find((season) => season.active) ??
      seedSeasons[0],
    teamStats: mapTeamStats(statsResult.data),
    players: mappedPlayers,
    games: mappedGames,
    posts: mappedPosts,
    galleries: mappedGalleries
  };
}

export async function getSiteData() {
  if (isSupabaseConfigured()) {
    const remote = await loadFromSupabase();
    if (remote) {
      return remote;
    }
  }

  return {
    settings: seedSiteSettings,
    seasons: seedSeasons,
    activeSeason: seedSeasons.find((season) => season.active) ?? seedSeasons[0],
    teamStats: seedTeamStats,
    players: seedPlayers,
    games: seedGames,
    posts: seedPosts,
    galleries: seedGalleries
  };
}

export async function getHomePayload(locale: Locale) {
  const data = await getSiteData();
  const dictionary = getDictionary(locale);
  const nextGame = data.games.find((game) => game.status === "scheduled") ?? data.games[0];
  const latestResult = data.games.find((game) => game.status === "final") ?? data.games[0];

  return {
    ...data,
    dictionary,
    nextGame,
    latestResult,
    featuredPlayers: data.players.filter((player) => player.featured).slice(0, 3),
    featuredPosts: data.posts.filter((post) => post.status === "published").slice(0, 3),
    featuredGalleries: data.galleries.filter((gallery) => gallery.status === "published").slice(0, 2)
  };
}

export async function getPlayerBySlug(slug: string) {
  const data = await getSiteData();
  return data.players.find((player) => player.slug === slug);
}

export async function getGameBySlug(slug: string) {
  const data = await getSiteData();
  return data.games.find((game) => game.slug === slug);
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
  return [...items].sort((a, b) => a.rosterOrder - b.rosterOrder || a.jerseyNumber - b.jerseyNumber);
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
