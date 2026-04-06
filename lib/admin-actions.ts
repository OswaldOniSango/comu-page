"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fromLocalDateTimeInput } from "@/lib/i18n";
import {
  buildScoreNotation,
  cleanBaseState,
  cleanRunnerAdvances,
  deriveEventFamily,
  derivePlayerBattingStats,
  getComuRuns,
  getOpponentRuns,
  sumStoredRunsByInning
} from "@/lib/scorebook";
import { requireAdminSession } from "@/lib/session";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  BaseDestination,
  BaseState,
  Locale,
  PlayerRole,
  PostKind,
  PublishStatus,
  RunnerAdvance,
  ScorebookEventCode
} from "@/lib/types";

const STORAGE_BUCKET = "media";
const MAX_IMAGE_SIZE = 1024 * 1024;
let storageReady: Promise<void> | null = null;

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function ensureAdmin(locale: Locale) {
  await requireAdminSession(locale);
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (value === null) {
    return null;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

async function ensureStorageBucket() {
  if (storageReady) {
    return storageReady;
  }

  storageReady = (async () => {
    const client = createAdminClient();
    if (!client) {
      return;
    }

    const { data } = await client.storage.getBucket(STORAGE_BUCKET);
    if (data) {
      return;
    }

    await client.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"]
    });
  })();

  return storageReady;
}

function getFileFromFormData(formData: FormData, name: string) {
  const value = formData.get(name);
  if (!value || typeof value === "string") {
    return null;
  }

  return value.size > 0 ? value : null;
}

async function uploadImageFile(
  client: NonNullable<ReturnType<typeof createAdminClient>>,
  file: File | null,
  folder: string,
  slugHint: string
) {
  if (!file) {
    return null;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image "${file.name}" exceeds the 1 MB limit.`);
  }

  await ensureStorageBucket();

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const fileName = `${Date.now()}-${slugify(slugHint || "asset")}.${extension}`;
  const filePath = `${folder}/${fileName}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(filePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = client.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  await client.from("media_assets").upsert(
    {
      file_name: file.name,
      file_path: filePath,
      mime_type: file.type || null,
      bucket: STORAGE_BUCKET
    },
    { onConflict: "file_path" }
  );

  return publicUrlData.publicUrl;
}

function getRedirectTo(formData: FormData) {
  const value = formData.get("redirectTo");
  return value ? String(value) : null;
}

async function revalidateAll(locale: Locale) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/roster`);
  revalidatePath(`/${locale}/games`);
  revalidatePath(`/${locale}/feed`);
  revalidatePath(`/${locale}/gallery`);
  revalidatePath(`/${locale}/about`);
  revalidatePath(`/${locale}/admin`);
}

function maybeRedirect(redirectTo: string | null) {
  if (redirectTo) {
    redirect(redirectTo);
  }
}

type ScorebookEventRow = {
  id: string;
  game_id: string;
  season_id: string;
  squad_id: string;
  sequence_no: number;
  inning_number: number;
  batter_player_id: string;
  event_family: string;
  event_code: ScorebookEventCode;
  hit_zone: string | null;
  fielder_path: string | null;
  outs_before: number;
  bases_before: BaseState | null;
  runner_advances: RunnerAdvance[] | null;
  rbi_count: number;
  runs_scored_count: number;
  notation: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type TeamStatsRow = {
  season_id: string;
  squad_id: string;
  wins: number;
  losses: number;
  runs_scored: number;
  runs_allowed: number;
  streak: string | null;
  standing: string | null;
};

type PlayerSeasonStatsRow = {
  player_id: string;
  season_id: string;
  squad_id: string;
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

type FinalGameRow = {
  id: string;
  is_home: boolean;
  home_score: number | null;
  away_score: number | null;
};

type GameScoreboardRow = {
  comu_runs_by_inning: Record<string, number> | null;
};

function parseBaseDestination(value: FormDataEntryValue | null, fallback: BaseDestination) {
  const raw = String(value || fallback);
  return raw === "1" || raw === "2" || raw === "3" || raw === "H" || raw === "O" ? raw : fallback;
}

function parseBaseState(formData: FormData) {
  return cleanBaseState({
    first: String(formData.get("baseFirstPlayerId") || ""),
    second: String(formData.get("baseSecondPlayerId") || ""),
    third: String(formData.get("baseThirdPlayerId") || "")
  });
}

function parseRunnerAdvances(formData: FormData, batterPlayerId: string, baseState: BaseState) {
  const advances: RunnerAdvance[] = [
    {
      runnerId: batterPlayerId,
      startBase: "B",
      endBase: parseBaseDestination(
        formData.get("advanceBatter"),
        parseBaseDestination(formData.get("defaultAdvanceBatter"), "1")
      )
    }
  ];

  if (baseState.first) {
    advances.push({
      runnerId: baseState.first,
      startBase: "1",
      endBase: parseBaseDestination(formData.get("advanceFirst"), "1")
    });
  }

  if (baseState.second) {
    advances.push({
      runnerId: baseState.second,
      startBase: "2",
      endBase: parseBaseDestination(formData.get("advanceSecond"), "2")
    });
  }

  if (baseState.third) {
    advances.push({
      runnerId: baseState.third,
      startBase: "3",
      endBase: parseBaseDestination(formData.get("advanceThird"), "3")
    });
  }

  return cleanRunnerAdvances(advances);
}

function revalidateScorebook(locale: Locale, gameId: string) {
  revalidatePath(`/${locale}/admin/games/${gameId}/scorebook`);
  revalidatePath(`/${locale}/admin/games`);
}

function hasPitchingStats(row?: PlayerSeasonStatsRow) {
  return Boolean(
    row &&
      [row.wins, row.losses, row.era, row.whip, row.strikeouts, row.saves].some((value) => value !== null)
  );
}

async function resequenceGameEvents(
  client: NonNullable<ReturnType<typeof createAdminClient>>,
  gameId: string
) {
  const { data } = await client
    .from("game_batting_events")
    .select("id")
    .eq("game_id", gameId)
    .order("sequence_no", { ascending: true });

  for (const [index, event] of (data ?? []).entries()) {
    await client.from("game_batting_events").update({ sequence_no: index + 1 }).eq("id", event.id);
  }
}

async function recomputeScorebookDerivedState(
  client: NonNullable<ReturnType<typeof createAdminClient>>,
  {
    gameId,
    seasonId,
    squadId
  }: {
    gameId: string;
    seasonId: string;
    squadId: string;
  }
) {
  const [seasonEventsResult, gameEventsResult, opponentLinesResult, gameResult, teamStatsResult, playerStatsResult, finalGamesResult, scoreboardResult] =
    await Promise.all([
      client
        .from("game_batting_events")
        .select("*")
        .eq("season_id", seasonId)
        .eq("squad_id", squadId)
        .order("sequence_no", { ascending: true }),
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
        .from("games")
        .select("id, is_home, status")
        .eq("id", gameId)
        .single(),
      client
        .from("team_season_stats")
        .select("*")
        .eq("season_id", seasonId)
        .eq("squad_id", squadId)
        .maybeSingle(),
      client
        .from("player_season_stats")
        .select("*")
        .eq("season_id", seasonId)
        .eq("squad_id", squadId),
      client
        .from("games")
        .select("id, is_home, home_score, away_score")
        .eq("season_id", seasonId)
        .eq("squad_id", squadId)
        .eq("status", "final"),
      client.from("game_scoreboards").select("comu_runs_by_inning").eq("game_id", gameId).maybeSingle()
    ]);

  const seasonEvents = (seasonEventsResult.data ?? []) as ScorebookEventRow[];
  const gameEvents = (gameEventsResult.data ?? []) as ScorebookEventRow[];
  const opponentLines = (opponentLinesResult.data ?? []) as Array<{ runs: number }>;
  const game = gameResult.data as { id: string; is_home: boolean; status: string } | null;
  const existingTeamStats = teamStatsResult.data as TeamStatsRow | null;
  const existingPlayerStats = (playerStatsResult.data ?? []) as PlayerSeasonStatsRow[];
  const finalGames = (finalGamesResult.data ?? []) as FinalGameRow[];
  const scoreboard = scoreboardResult.data as GameScoreboardRow | null;

  const derivedComuRuns = getComuRuns(
    gameEvents.map((event) => ({
      id: event.id,
      gameId: event.game_id,
      seasonId: event.season_id,
      squadId: event.squad_id === "a3" ? "a3" : "a1",
      sequenceNo: event.sequence_no,
      inningNumber: event.inning_number,
      batterPlayerId: event.batter_player_id,
      eventFamily: event.event_family as never,
      eventCode: event.event_code,
      hitZone: event.hit_zone === "7" || event.hit_zone === "8" || event.hit_zone === "9" ? event.hit_zone : undefined,
      fielderPath: event.fielder_path ?? undefined,
      outsBefore: event.outs_before,
      basesBefore: event.bases_before ?? {},
      runnerAdvances: event.runner_advances ?? [],
      rbiCount: event.rbi_count,
      runsScoredCount: event.runs_scored_count,
      notation: event.notation,
      notes: event.notes ?? undefined,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }))
  );
  const comuRuns =
    scoreboard?.comu_runs_by_inning && Object.keys(scoreboard.comu_runs_by_inning).length
      ? sumStoredRunsByInning(scoreboard.comu_runs_by_inning)
      : derivedComuRuns;
  const opponentRuns = getOpponentRuns(
    opponentLines.map((line, index) => ({
      gameId,
      inningNumber: index + 1,
      runs: line.runs
    }))
  );

  if (game) {
    await client
      .from("games")
      .update(
        game.is_home
          ? { home_score: comuRuns, away_score: opponentRuns }
          : { away_score: comuRuns, home_score: opponentRuns }
      )
      .eq("id", gameId);
  }

  const derivedBatting = derivePlayerBattingStats(
    seasonEvents.map((event) => ({
      id: event.id,
      gameId: event.game_id,
      seasonId: event.season_id,
      squadId: event.squad_id === "a3" ? "a3" : "a1",
      sequenceNo: event.sequence_no,
      inningNumber: event.inning_number,
      batterPlayerId: event.batter_player_id,
      eventFamily: event.event_family as never,
      eventCode: event.event_code,
      hitZone: event.hit_zone === "7" || event.hit_zone === "8" || event.hit_zone === "9" ? event.hit_zone : undefined,
      fielderPath: event.fielder_path ?? undefined,
      outsBefore: event.outs_before,
      basesBefore: event.bases_before ?? {},
      runnerAdvances: event.runner_advances ?? [],
      rbiCount: event.rbi_count,
      runsScoredCount: event.runs_scored_count,
      notation: event.notation,
      notes: event.notes ?? undefined,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }))
  );

  const playerIds = new Set([
    ...Object.keys(derivedBatting),
    ...existingPlayerStats.map((row) => row.player_id)
  ]);

  if (playerIds.size) {
    const rows = [...playerIds].map((playerId) => {
      const existing = existingPlayerStats.find((row) => row.player_id === playerId);
      const derived = derivedBatting[playerId];

      return {
        player_id: playerId,
        season_id: seasonId,
        squad_id: squadId,
        games_played:
          derived?.gamesPlayed ??
          (hasPitchingStats(existing) ? Number(existing?.games_played || 0) : 0),
        avg: derived?.avg ?? null,
        obp: derived?.obp ?? null,
        slg: derived?.slg ?? null,
        ops: derived?.ops ?? null,
        home_runs: derived?.homeRuns ?? 0,
        runs_batted_in: derived?.runsBattedIn ?? 0,
        runs: derived?.runs ?? 0,
        stolen_bases: existing?.stolen_bases ?? null,
        wins: existing?.wins ?? null,
        losses: existing?.losses ?? null,
        era: existing?.era ?? null,
        whip: existing?.whip ?? null,
        strikeouts: existing?.strikeouts ?? null,
        saves: existing?.saves ?? null
      };
    });

    await client.from("player_season_stats").upsert(rows, {
      onConflict: "player_id,season_id,squad_id"
    });
  }

  const updatedFinalGames = finalGames.map((row) => {
    if (row.id !== gameId || !game || game.status !== "final") {
      return row;
    }

    return game.is_home
      ? { ...row, home_score: comuRuns, away_score: opponentRuns }
      : { ...row, away_score: comuRuns, home_score: opponentRuns };
  });

  const computedTeamLine = updatedFinalGames.reduce(
    (totals, row) => {
      const comuScore = row.is_home ? Number(row.home_score || 0) : Number(row.away_score || 0);
      const oppScore = row.is_home ? Number(row.away_score || 0) : Number(row.home_score || 0);

      return {
        wins: totals.wins + (comuScore > oppScore ? 1 : 0),
        losses: totals.losses + (comuScore < oppScore ? 1 : 0),
        runsScored: totals.runsScored + comuScore,
        runsAllowed: totals.runsAllowed + oppScore
      };
    },
    { wins: 0, losses: 0, runsScored: 0, runsAllowed: 0 }
  );

  await client.from("team_season_stats").upsert(
    {
      season_id: seasonId,
      squad_id: squadId,
      wins: computedTeamLine.wins,
      losses: computedTeamLine.losses,
      runs_scored: computedTeamLine.runsScored,
      runs_allowed: computedTeamLine.runsAllowed,
      streak: existingTeamStats?.streak ?? "",
      standing: existingTeamStats?.standing ?? ""
    },
    { onConflict: "season_id,squad_id" }
  );
}

export async function savePlayerAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    await revalidateAll(locale);
    return;
  }

  const client = createAdminClient();
  if (!client) {
    return;
  }

  const playerId = String(formData.get("id") || "");
  const firstName = String(formData.get("firstName") || "");
  const lastName = String(formData.get("lastName") || "");
  const seasonId = String(formData.get("seasonId") || "season-2026");
  const squadId = String(formData.get("squadId") || "a1");
  const slug = slugify(`${firstName}-${lastName}`);
  const uploadedPhoto = await uploadImageFile(
    client,
    getFileFromFormData(formData, "photoFile"),
    "players",
    `${firstName}-${lastName}`
  );
  const payload = {
    slug,
    first_name: firstName,
    last_name: lastName,
    role: String(formData.get("role") || "hitter") as PlayerRole,
    bats: String(formData.get("bats") || ""),
    throws: String(formData.get("throws") || ""),
    hometown: String(formData.get("hometown") || ""),
    photo_url: uploadedPhoto || String(formData.get("photo") || ""),
    jersey_number: Number(formData.get("jerseyNumber") || 0),
    position: String(formData.get("position") || "UTIL"),
    featured: parseBoolean(formData.get("featured")),
    roster_order: Number(formData.get("rosterOrder") || 99),
    status: String(formData.get("status") || "draft") as PublishStatus
  };

  const playerQuery = playerId
    ? client.from("players").update(payload).eq("id", playerId)
    : client.from("players").insert(payload);

  const { data: player } = await playerQuery.select("id").single();

  if (player?.id) {
    await client.from("player_translations").upsert(
      [
        {
          player_id: player.id,
          locale: "es",
          bio: String(formData.get("bioEs") || ""),
          spotlight_quote: String(formData.get("quoteEs") || "")
        },
        {
          player_id: player.id,
          locale: "en",
          bio: String(formData.get("bioEn") || ""),
          spotlight_quote: String(formData.get("quoteEn") || "")
        }
      ],
      { onConflict: "player_id,locale" }
    );

    await client.from("player_assignments").upsert(
      {
        player_id: player.id,
        season_id: seasonId,
        squad_id: squadId,
        jersey_number: Number(formData.get("jerseyNumber") || 0),
        position: String(formData.get("position") || "UTIL"),
        featured: parseBoolean(formData.get("featured")),
        roster_order: Number(formData.get("rosterOrder") || 99),
        status: String(formData.get("status") || "draft") as PublishStatus
      },
      { onConflict: "player_id,season_id,squad_id" }
    );
  }

  await revalidateAll(locale);
  maybeRedirect(redirectTo);
}

export async function saveGameAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    await revalidateAll(locale);
    return;
  }

  const client = createAdminClient();
  if (!client) {
    return;
  }

  const gameId = String(formData.get("id") || "");
  const opponent = String(formData.get("opponent") || "");
  const startsAt = fromLocalDateTimeInput(String(formData.get("startsAt") || ""));
  const slug = slugify(`${opponent}-${startsAt.slice(0, 10)}`);
  const uploadedCover = await uploadImageFile(
    client,
    getFileFromFormData(formData, "coverImageFile"),
    "games",
    slug
  );
  const payload = {
    slug,
    season_id: String(formData.get("seasonId") || "season-2026"),
    squad_id: String(formData.get("squadId") || "a1"),
    opponent,
    starts_at: startsAt,
    venue: String(formData.get("venue") || ""),
    is_home: String(formData.get("isHome") || "true") === "true",
    status: String(formData.get("status") || "scheduled"),
    home_score: Number(formData.get("homeScore") || 0),
    away_score: Number(formData.get("awayScore") || 0),
    cover_image_url: uploadedCover || String(formData.get("coverImage") || "")
  };

  const gameQuery = gameId
    ? client.from("games").update(payload).eq("id", gameId)
    : client.from("games").insert(payload);

  const { data: game } = await gameQuery.select("id").single();

  if (game?.id) {
    await client.from("game_translations").upsert(
      [
        {
          game_id: game.id,
          locale: "es",
          headline: String(formData.get("headlineEs") || ""),
          summary: String(formData.get("summaryEs") || ""),
          key_moment: String(formData.get("keyMomentEs") || "")
        },
        {
          game_id: game.id,
          locale: "en",
          headline: String(formData.get("headlineEn") || ""),
          summary: String(formData.get("summaryEn") || ""),
          key_moment: String(formData.get("keyMomentEn") || "")
        }
      ],
      { onConflict: "game_id,locale" }
    );
  }

  await revalidateAll(locale);
  maybeRedirect(redirectTo);
}

export async function saveGameBattingEventAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    revalidateScorebook(locale, String(formData.get("gameId") || ""));
    return;
  }

  const client = createAdminClient();
  if (!client) {
    return;
  }

  const id = String(formData.get("id") || "");
  const gameId = String(formData.get("gameId") || "");
  const seasonId = String(formData.get("seasonId") || "season-2026");
  const squadId = String(formData.get("squadId") || "a1");
  const batterPlayerId = String(formData.get("batterPlayerId") || "");
  const eventCode = String(formData.get("eventCode") || "single") as ScorebookEventCode;
  const baseState = parseBaseState(formData);
  const runnerAdvances = parseRunnerAdvances(formData, batterPlayerId, baseState);
  const notation = buildScoreNotation(
    eventCode,
    String(formData.get("hitZone") || "") || null,
    String(formData.get("fielderPath") || "") || null
  );
  const runsScoredCount = runnerAdvances.filter((advance) => advance.endBase === "H").length;
  const payload = {
    game_id: gameId,
    season_id: seasonId,
    squad_id: squadId,
    inning_number: Number(formData.get("inningNumber") || 1),
    batter_player_id: batterPlayerId,
    event_family: deriveEventFamily(eventCode),
    event_code: eventCode,
    hit_zone: String(formData.get("hitZone") || "") || null,
    fielder_path: String(formData.get("fielderPath") || "") || null,
    outs_before: Number(formData.get("outsBefore") || 0),
    bases_before: baseState,
    runner_advances: runnerAdvances,
    rbi_count: Number(formData.get("rbiCount") || 0),
    runs_scored_count: runsScoredCount,
    notation,
    notes: String(formData.get("notes") || "") || null
  };

  if (id) {
    await client.from("game_batting_events").update(payload).eq("id", id);
  } else {
    const { count } = await client
      .from("game_batting_events")
      .select("id", { count: "exact", head: true })
      .eq("game_id", gameId);

    await client.from("game_batting_events").insert({
      ...payload,
      sequence_no: (count ?? 0) + 1
    });
  }

  await resequenceGameEvents(client, gameId);
  await recomputeScorebookDerivedState(client, { gameId, seasonId, squadId });
  await revalidateAll(locale);
  revalidateScorebook(locale, gameId);
  maybeRedirect(redirectTo);
}

export async function deleteGameBattingEventAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    revalidateScorebook(locale, String(formData.get("gameId") || ""));
    return;
  }

  const client = createAdminClient();
  const id = String(formData.get("id") || "");
  const gameId = String(formData.get("gameId") || "");
  const seasonId = String(formData.get("seasonId") || "season-2026");
  const squadId = String(formData.get("squadId") || "a1");
  if (!client || !id || !gameId) {
    return;
  }

  await client.from("game_batting_events").delete().eq("id", id);
  await resequenceGameEvents(client, gameId);
  await recomputeScorebookDerivedState(client, { gameId, seasonId, squadId });
  await revalidateAll(locale);
  revalidateScorebook(locale, gameId);
  maybeRedirect(redirectTo);
}

export async function saveOpponentLinescoreAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    revalidateScorebook(locale, String(formData.get("gameId") || ""));
    return;
  }

  const client = createAdminClient();
  if (!client) {
    return;
  }

  const gameId = String(formData.get("gameId") || "");
  const seasonId = String(formData.get("seasonId") || "season-2026");
  const squadId = String(formData.get("squadId") || "a1");

  const comuRunsByInning = Object.fromEntries(
    Array.from(formData.keys())
      .filter((key) => key.startsWith("comuRuns_"))
      .map((key) => Number(key.replace("comuRuns_", "")))
      .filter((inning) => !Number.isNaN(inning))
      .sort((a, b) => a - b)
      .map((inning) => [String(inning), Number(formData.get(`comuRuns_${inning}`) || 0)])
  );

  await client.from("game_scoreboards").upsert(
    {
      game_id: gameId,
      comu_abbreviation: String(formData.get("comuAbbreviation") || "COMU"),
      opponent_abbreviation: String(formData.get("opponentAbbreviation") || "RIV"),
      comu_runs_by_inning: comuRunsByInning,
      comu_errors: Number(formData.get("comuErrors") || 0),
      opponent_hits: Number(formData.get("opponentHits") || 0),
      opponent_errors: Number(formData.get("opponentErrors") || 0)
    },
    { onConflict: "game_id" }
  );

  const innings = Array.from(formData.keys())
    .filter((key) => key.startsWith("opponentRuns_"))
    .map((key) => Number(key.replace("opponentRuns_", "")))
    .filter((inning) => !Number.isNaN(inning))
    .sort((a, b) => a - b);

  for (const inning of innings) {
    const runs = Number(formData.get(`opponentRuns_${inning}`) || 0);
    await client.from("game_opponent_linescore").upsert(
      {
        game_id: gameId,
        inning_number: inning,
        runs
      },
      { onConflict: "game_id,inning_number" }
    );
  }

  await recomputeScorebookDerivedState(client, { gameId, seasonId, squadId });
  await revalidateAll(locale);
  revalidateScorebook(locale, gameId);
  maybeRedirect(redirectTo);
}

export async function saveGameLineupAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    revalidateScorebook(locale, String(formData.get("gameId") || ""));
    return;
  }

  const client = createAdminClient();
  if (!client) {
    return;
  }

  const gameId = String(formData.get("gameId") || "");
  const entries = Array.from({ length: 9 }, (_, index) => index + 1)
    .map((battingOrder) => ({
      battingOrder,
      playerId: String(formData.get(`lineupPlayer_${battingOrder}`) || ""),
      defensivePosition: String(formData.get(`lineupPosition_${battingOrder}`) || "DH")
    }))
    .filter((entry) => entry.playerId);

  const dedupedEntries = entries.filter(
    (entry, index, list) => list.findIndex((candidate) => candidate.playerId === entry.playerId) === index
  );

  await client.from("game_lineup_entries").delete().eq("game_id", gameId);

  if (dedupedEntries.length) {
    await client.from("game_lineup_entries").insert(
      dedupedEntries.map((entry) => ({
        game_id: gameId,
        batting_order: entry.battingOrder,
        player_id: entry.playerId,
        defensive_position: entry.defensivePosition
      }))
    );
  }

  await revalidateAll(locale);
  revalidateScorebook(locale, gameId);
  maybeRedirect(redirectTo);
}

export async function savePostAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    await revalidateAll(locale);
    return;
  }

  const client = createAdminClient();
  if (!client) {
    return;
  }

  const postId = String(formData.get("id") || "");
  const titleEs = String(formData.get("titleEs") || "");
  const slug = slugify(titleEs);
  const uploadedCover = await uploadImageFile(
    client,
    getFileFromFormData(formData, "coverImageFile"),
    "posts",
    slug
  );
  const payload = {
    slug,
    season_id: String(formData.get("seasonId") || "season-2026"),
    kind: String(formData.get("kind") || "news") as PostKind,
    status: String(formData.get("status") || "draft") as PublishStatus,
    published_at: fromLocalDateTimeInput(String(formData.get("publishedAt") || "")),
    cover_image_url: uploadedCover || String(formData.get("coverImage") || ""),
    author_name: String(formData.get("authorName") || "Comunicaciones"),
    is_featured: parseBoolean(formData.get("featured"))
  };

  const postQuery = postId
    ? client.from("posts").update(payload).eq("id", postId)
    : client.from("posts").insert(payload);

  const { data: post } = await postQuery.select("id").single();

  if (post?.id) {
    await client.from("post_translations").upsert(
      [
        {
          post_id: post.id,
          locale: "es",
          title: titleEs,
          excerpt: String(formData.get("excerptEs") || ""),
          body: String(formData.get("bodyEs") || "")
        },
        {
          post_id: post.id,
          locale: "en",
          title: String(formData.get("titleEn") || ""),
          excerpt: String(formData.get("excerptEn") || ""),
          body: String(formData.get("bodyEn") || "")
        }
      ],
      { onConflict: "post_id,locale" }
    );
  }

  await revalidateAll(locale);
  maybeRedirect(redirectTo);
}

export async function saveGalleryAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    await revalidateAll(locale);
    return;
  }

  const client = createAdminClient();
  if (!client) {
    return;
  }

  const galleryId = String(formData.get("id") || "");
  const titleEs = String(formData.get("titleEs") || "");
  const slug = slugify(titleEs);
  const uploadedCover = await uploadImageFile(
    client,
    getFileFromFormData(formData, "coverImageFile"),
    "galleries",
    `${slug}-cover`
  );
  const payload = {
    slug,
    status: String(formData.get("status") || "draft"),
    event_date: fromLocalDateTimeInput(String(formData.get("eventDate") || "")),
    cover_image_url: uploadedCover || String(formData.get("coverImage") || "")
  };

  const galleryQuery = galleryId
    ? client.from("galleries").update(payload).eq("id", galleryId)
    : client.from("galleries").insert(payload);

  const { data: gallery } = await galleryQuery.select("id").single();

  if (gallery?.id) {
    await client.from("gallery_translations").upsert(
      [
        {
          gallery_id: gallery.id,
          locale: "es",
          title: titleEs,
          description: String(formData.get("descriptionEs") || "")
        },
        {
          gallery_id: gallery.id,
          locale: "en",
          title: String(formData.get("titleEn") || ""),
          description: String(formData.get("descriptionEn") || "")
        }
      ],
      { onConflict: "gallery_id,locale" }
    );

    const existingImagesCount =
      (await client
        .from("gallery_images")
        .select("id", { count: "exact", head: true })
        .eq("gallery_id", gallery.id)).count ?? 0;

    const galleryFiles = formData.getAll("galleryImages").filter((value): value is File => {
      return typeof value !== "string" && value.size > 0;
    });

    for (const [index, file] of galleryFiles.entries()) {
      const imageUrl = await uploadImageFile(client, file, "galleries", `${slug}-${index + 1}`);
      if (!imageUrl) {
        continue;
      }

      await client.from("gallery_images").insert({
        gallery_id: gallery.id,
        image_url: imageUrl,
        alt_es: titleEs,
        alt_en: String(formData.get("titleEn") || titleEs),
        caption_es: titleEs,
        caption_en: String(formData.get("titleEn") || titleEs),
        sort_order: existingImagesCount + index + 1
      });
    }
  }

  await revalidateAll(locale);
  maybeRedirect(redirectTo);
}

export async function deletePlayerAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    await revalidateAll(locale);
    return;
  }

  const client = createAdminClient();
  const id = String(formData.get("id") || "");
  if (!client || !id) {
    return;
  }

  await client.from("players").delete().eq("id", id);
  await revalidateAll(locale);
  maybeRedirect(redirectTo);
}

export async function deleteGameAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    await revalidateAll(locale);
    return;
  }

  const client = createAdminClient();
  const id = String(formData.get("id") || "");
  if (!client || !id) {
    return;
  }

  await client.from("games").delete().eq("id", id);
  await revalidateAll(locale);
  maybeRedirect(redirectTo);
}

export async function deletePostAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    await revalidateAll(locale);
    return;
  }

  const client = createAdminClient();
  const id = String(formData.get("id") || "");
  if (!client || !id) {
    return;
  }

  await client.from("posts").delete().eq("id", id);
  await revalidateAll(locale);
  maybeRedirect(redirectTo);
}

export async function deleteGalleryAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    await revalidateAll(locale);
    return;
  }

  const client = createAdminClient();
  const id = String(formData.get("id") || "");
  if (!client || !id) {
    return;
  }

  await client.from("galleries").delete().eq("id", id);
  await revalidateAll(locale);
  maybeRedirect(redirectTo);
}

export async function saveTeamStatsAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    await revalidateAll(locale);
    return;
  }

  const client = createAdminClient();
  if (!client) {
    return;
  }

  await client.from("team_season_stats").upsert(
    {
      season_id: String(formData.get("seasonId") || "season-2026"),
      squad_id: String(formData.get("squadId") || "a1"),
      wins: Number(formData.get("wins") || 0),
      losses: Number(formData.get("losses") || 0),
      runs_scored: Number(formData.get("runsScored") || 0),
      runs_allowed: Number(formData.get("runsAllowed") || 0),
      streak: String(formData.get("streak") || ""),
      standing: String(formData.get("standing") || "")
    },
    { onConflict: "season_id,squad_id" }
  );

  await revalidateAll(locale);
  maybeRedirect(redirectTo);
}

export async function savePlayerStatsAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  const redirectTo = getRedirectTo(formData);
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    await revalidateAll(locale);
    return;
  }

  const client = createAdminClient();
  const playerId = String(formData.get("playerId") || "");
  const seasonId = String(formData.get("seasonId") || "season-2026");
  const squadId = String(formData.get("squadId") || "a1");
  if (!client || !playerId) {
    return;
  }

  await client.from("player_season_stats").upsert(
    {
      player_id: playerId,
      season_id: seasonId,
      squad_id: squadId,
      games_played: Number(formData.get("gamesPlayed") || 0),
      avg: parseOptionalNumber(formData.get("avg")),
      obp: parseOptionalNumber(formData.get("obp")),
      slg: parseOptionalNumber(formData.get("slg")),
      ops: parseOptionalNumber(formData.get("ops")),
      home_runs: parseOptionalNumber(formData.get("homeRuns")),
      runs_batted_in: parseOptionalNumber(formData.get("runsBattedIn")),
      runs: parseOptionalNumber(formData.get("runs")),
      stolen_bases: parseOptionalNumber(formData.get("stolenBases")),
      wins: parseOptionalNumber(formData.get("wins")),
      losses: parseOptionalNumber(formData.get("losses")),
      era: parseOptionalNumber(formData.get("era")),
      whip: parseOptionalNumber(formData.get("whip")),
      strikeouts: parseOptionalNumber(formData.get("strikeouts")),
      saves: parseOptionalNumber(formData.get("saves"))
    },
    { onConflict: "player_id,season_id,squad_id" }
  );

  await revalidateAll(locale);
  maybeRedirect(redirectTo);
}

export async function saveSiteSettingsAction(formData: FormData) {
  const locale = (formData.get("locale") as Locale) || "es";
  await ensureAdmin(locale);

  if (!isSupabaseConfigured()) {
    await revalidateAll(locale);
    return;
  }

  const client = createAdminClient();
  if (!client) {
    return;
  }

  const uploadedHeroImage = await uploadImageFile(
    client,
    getFileFromFormData(formData, "heroImageFile"),
    "settings",
    "hero-image"
  );
  const uploadedLogo = await uploadImageFile(
    client,
    getFileFromFormData(formData, "logoFile"),
    "settings",
    "logo-mark"
  );

  await client.from("site_settings").upsert(
    {
      id: "primary",
      team_name: String(formData.get("teamName") || "Comunicaciones Baseball"),
      short_name: String(formData.get("shortName") || "Comunicaciones"),
      primary_color: String(formData.get("primaryColor") || "#f5c400"),
      secondary_color: String(formData.get("secondaryColor") || "#080808"),
      tagline_es: String(formData.get("taglineEs") || ""),
      tagline_en: String(formData.get("taglineEn") || ""),
      mission_es: String(formData.get("missionEs") || ""),
      mission_en: String(formData.get("missionEn") || ""),
      hero_image_url: uploadedHeroImage || String(formData.get("heroImage") || ""),
      logo_url: uploadedLogo || String(formData.get("logo") || ""),
      instagram_url: String(formData.get("instagram") || ""),
      facebook_url: String(formData.get("facebook") || ""),
      x_url: String(formData.get("x") || "")
    },
    { onConflict: "id" }
  );

  await revalidateAll(locale);
}
