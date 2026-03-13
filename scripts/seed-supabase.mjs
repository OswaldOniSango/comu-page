import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import ts from "typescript";

async function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env.local");

  try {
    const raw = await readFile(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Environment variables may already be set by the shell.
  }
}

async function loadSeedModule() {
  const sourcePath = resolve(process.cwd(), "data/site-content.ts");
  const source = await readFile(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    },
    fileName: sourcePath
  });

  const payload = Buffer.from(transpiled.outputText, "utf8").toString("base64");
  return import(`data:text/javascript;base64,${payload}`);
}

await loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const { siteSettings, seasons, squads, teamStatsBySquad, players, games, posts, galleries } =
  await loadSeedModule();

function maybeNull(value) {
  return value === undefined ? null : value;
}

async function upsertSiteSettings() {
  const { error } = await supabase.from("site_settings").upsert(
    {
      id: "primary",
      team_name: siteSettings.teamName,
      short_name: siteSettings.shortName,
      primary_color: siteSettings.primaryColor,
      secondary_color: siteSettings.secondaryColor,
      tagline_es: siteSettings.tagline.es,
      tagline_en: siteSettings.tagline.en,
      mission_es: siteSettings.mission.es,
      mission_en: siteSettings.mission.en,
      hero_image_url: siteSettings.heroImage,
      logo_url: siteSettings.logoMark,
      instagram_url: siteSettings.socialLinks.instagram ?? null,
      facebook_url: siteSettings.socialLinks.facebook ?? null,
      x_url: siteSettings.socialLinks.x ?? null
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

async function upsertSeasons() {
  const { error } = await supabase.from("seasons").upsert(
    seasons.map((season) => ({
      id: season.id,
      year: season.year,
      label: season.label,
      is_active: season.active
    })),
    { onConflict: "id" }
  );

  if (error) throw error;
}

async function upsertSquads() {
  const { error } = await supabase.from("squads").upsert(
    squads.map((squad) => ({
      id: squad.id,
      code: squad.code,
      name_es: squad.name.es,
      name_en: squad.name.en,
      sort_order: squad.sortOrder,
      is_default: squad.isDefault,
      is_active: squad.isActive
    })),
    { onConflict: "id" }
  );

  if (error) throw error;
}

async function upsertTeamStats() {
  const { error } = await supabase.from("team_season_stats").upsert(
    teamStatsBySquad.map((teamStats) => ({
      season_id: teamStats.seasonId,
      squad_id: teamStats.squadId,
      wins: teamStats.wins,
      losses: teamStats.losses,
      runs_scored: teamStats.runsScored,
      runs_allowed: teamStats.runsAllowed,
      streak: teamStats.streak,
      standing: teamStats.standing ?? null
    })),
    { onConflict: "season_id,squad_id" }
  );

  if (error) throw error;
}

async function upsertPlayers() {
  for (const player of players) {
    const { data, error } = await supabase
      .from("players")
      .upsert(
        {
          slug: player.slug,
          first_name: player.firstName,
          last_name: player.lastName,
          jersey_number: player.assignment.jerseyNumber,
          position: player.assignment.position,
          role: player.role,
          bats: player.bats ?? null,
          throws: player.throws ?? null,
          hometown: player.hometown ?? null,
          photo_url: player.photo,
          featured: player.assignment.featured,
          roster_order: player.assignment.rosterOrder,
          status: player.assignment.status
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (error) throw error;

    const { error: translationsError } = await supabase.from("player_translations").upsert(
      [
        {
          player_id: data.id,
          locale: "es",
          bio: player.bio.es,
          spotlight_quote: player.spotlightQuote?.es ?? ""
        },
        {
          player_id: data.id,
          locale: "en",
          bio: player.bio.en,
          spotlight_quote: player.spotlightQuote?.en ?? ""
        }
      ],
      { onConflict: "player_id,locale" }
    );
    if (translationsError) throw translationsError;

    const { error: assignmentError } = await supabase.from("player_assignments").upsert(
      {
        player_id: data.id,
        season_id: player.assignment.seasonId,
        squad_id: player.assignment.squadId,
        jersey_number: player.assignment.jerseyNumber,
        position: player.assignment.position,
        featured: player.assignment.featured,
        roster_order: player.assignment.rosterOrder,
        status: player.assignment.status
      },
      { onConflict: "player_id,season_id,squad_id" }
    );
    if (assignmentError) throw assignmentError;

    const { error: statsError } = await supabase.from("player_season_stats").upsert(
      {
        player_id: data.id,
        season_id: player.stats.seasonId,
        squad_id: player.stats.squadId,
        games_played: player.stats.gamesPlayed,
        avg: maybeNull(player.stats.avg),
        obp: maybeNull(player.stats.obp),
        slg: maybeNull(player.stats.slg),
        ops: maybeNull(player.stats.ops),
        home_runs: maybeNull(player.stats.homeRuns),
        runs_batted_in: maybeNull(player.stats.runsBattedIn),
        runs: maybeNull(player.stats.runs),
        stolen_bases: maybeNull(player.stats.stolenBases),
        wins: maybeNull(player.stats.wins),
        losses: maybeNull(player.stats.losses),
        era: maybeNull(player.stats.era),
        whip: maybeNull(player.stats.whip),
        strikeouts: maybeNull(player.stats.strikeouts),
        saves: maybeNull(player.stats.saves)
      },
      { onConflict: "player_id,season_id,squad_id" }
    );
    if (statsError) throw statsError;
  }
}

async function upsertGames() {
  for (const game of games) {
    const { data, error } = await supabase
      .from("games")
      .upsert(
        {
          slug: game.slug,
          season_id: game.seasonId,
          squad_id: game.squadId,
          opponent: game.opponent,
          starts_at: game.startsAt,
          venue: game.venue,
          is_home: game.isHome,
          status: game.status,
          home_score: maybeNull(game.homeScore),
          away_score: maybeNull(game.awayScore),
          cover_image_url: game.coverImage
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (error) throw error;

    const { error: translationsError } = await supabase.from("game_translations").upsert(
      [
        {
          game_id: data.id,
          locale: "es",
          headline: game.headline.es,
          summary: game.summary.es,
          key_moment: game.keyMoment?.es ?? ""
        },
        {
          game_id: data.id,
          locale: "en",
          headline: game.headline.en,
          summary: game.summary.en,
          key_moment: game.keyMoment?.en ?? ""
        }
      ],
      { onConflict: "game_id,locale" }
    );
    if (translationsError) throw translationsError;
  }
}

async function upsertPosts() {
  for (const post of posts) {
    const { data, error } = await supabase
      .from("posts")
      .upsert(
        {
          slug: post.slug,
          season_id: post.seasonId,
          kind: post.kind,
          status: post.status,
          published_at: post.publishedAt,
          cover_image_url: post.coverImage,
          author_name: post.authorName,
          is_featured: post.featured
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (error) throw error;

    const { error: translationsError } = await supabase.from("post_translations").upsert(
      [
        {
          post_id: data.id,
          locale: "es",
          title: post.title.es,
          excerpt: post.excerpt.es,
          body: post.body.es
        },
        {
          post_id: data.id,
          locale: "en",
          title: post.title.en,
          excerpt: post.excerpt.en,
          body: post.body.en
        }
      ],
      { onConflict: "post_id,locale" }
    );
    if (translationsError) throw translationsError;
  }
}

async function upsertGalleries() {
  for (const gallery of galleries) {
    const { data, error } = await supabase
      .from("galleries")
      .upsert(
        {
          slug: gallery.slug,
          status: gallery.status,
          event_date: gallery.eventDate,
          cover_image_url: gallery.coverImage
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (error) throw error;

    const { error: translationsError } = await supabase.from("gallery_translations").upsert(
      [
        {
          gallery_id: data.id,
          locale: "es",
          title: gallery.title.es,
          description: gallery.description.es
        },
        {
          gallery_id: data.id,
          locale: "en",
          title: gallery.title.en,
          description: gallery.description.en
        }
      ],
      { onConflict: "gallery_id,locale" }
    );
    if (translationsError) throw translationsError;

    const { error: deleteImagesError } = await supabase
      .from("gallery_images")
      .delete()
      .eq("gallery_id", data.id);
    if (deleteImagesError) throw deleteImagesError;

    if (gallery.images.length) {
      const { error: imagesError } = await supabase.from("gallery_images").insert(
        gallery.images.map((image) => ({
          gallery_id: data.id,
          image_url: image.image,
          alt_es: image.alt.es,
          alt_en: image.alt.en,
          caption_es: image.caption?.es ?? "",
          caption_en: image.caption?.en ?? "",
          sort_order: image.order
        }))
      );
      if (imagesError) throw imagesError;
    }
  }
}

await upsertSiteSettings();
await upsertSeasons();
await upsertSquads();
await upsertTeamStats();
await upsertPlayers();
await upsertGames();
await upsertPosts();
await upsertGalleries();

console.log("Supabase seed completed successfully.");
