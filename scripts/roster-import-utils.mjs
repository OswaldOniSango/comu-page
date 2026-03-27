import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=900&q=80";

export async function loadEnvFile() {
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
    // Variables may already be present in the shell.
  }
}

export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function titleCaseName(input) {
  return input
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) =>
      part
        .split("-")
        .map((chunk) => (chunk ? chunk[0].toUpperCase() + chunk.slice(1) : ""))
        .join("-")
    )
    .join(" ");
}

export function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function parseRosterName(rawName) {
  const normalized = rawName.replace(/\?/g, "ñ").trim();

  if (normalized.includes(",")) {
    const [lastNameRaw, firstNameRaw] = normalized.split(",");
    return {
      firstName: titleCaseName(firstNameRaw),
      lastName: titleCaseName(lastNameRaw)
    };
  }

  const parts = normalized.split(/\s+/);
  const firstName = parts.pop() || "";
  const lastName = parts.join(" ");

  return {
    firstName: titleCaseName(firstName),
    lastName: titleCaseName(lastName)
  };
}

export async function getActiveSeasonId(supabase) {
  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id || "season-2026";
}

export async function importRoster({
  supabase,
  squadId,
  players,
  seasonId,
  dryRun = false
}) {
  const results = [];

  for (const [index, player] of players.entries()) {
    const parsedName = parseRosterName(player.name);
    const slug = slugify(`${parsedName.firstName} ${parsedName.lastName}`);
    const rosterOrder = index + 1;

    const payload = {
      slug,
      first_name: parsedName.firstName,
      last_name: parsedName.lastName,
      jersey_number: player.number,
      position: "UTIL",
      role: "hitter",
      bats: null,
      throws: null,
      hometown: null,
      photo_url: DEFAULT_PHOTO,
      featured: false,
      roster_order: rosterOrder,
      status: "published"
    };

    if (dryRun) {
      results.push({
        slug,
        squadId,
        seasonId,
        firstName: parsedName.firstName,
        lastName: parsedName.lastName,
        jerseyNumber: player.number
      });
      continue;
    }

    const { data: playerRow, error: playerError } = await supabase
      .from("players")
      .upsert(payload, { onConflict: "slug" })
      .select("id")
      .single();

    if (playerError) {
      throw playerError;
    }

    const { error: translationsError } = await supabase.from("player_translations").upsert(
      [
        {
          player_id: playerRow.id,
          locale: "es",
          bio: "",
          spotlight_quote: ""
        },
        {
          player_id: playerRow.id,
          locale: "en",
          bio: "",
          spotlight_quote: ""
        }
      ],
      { onConflict: "player_id,locale" }
    );

    if (translationsError) {
      throw translationsError;
    }

    const { error: assignmentError } = await supabase.from("player_assignments").upsert(
      {
        player_id: playerRow.id,
        season_id: seasonId,
        squad_id: squadId,
        jersey_number: player.number,
        position: "UTIL",
        featured: false,
        roster_order: rosterOrder,
        status: "published"
      },
      { onConflict: "player_id,season_id,squad_id" }
    );

    if (assignmentError) {
      throw assignmentError;
    }

    const { error: statsError } = await supabase.from("player_season_stats").upsert(
      {
        player_id: playerRow.id,
        season_id: seasonId,
        squad_id: squadId,
        games_played: 0,
        avg: null,
        obp: null,
        slg: null,
        ops: null,
        home_runs: null,
        runs_batted_in: null,
        runs: null,
        stolen_bases: null,
        wins: null,
        losses: null,
        era: null,
        whip: null,
        strikeouts: null,
        saves: null
      },
      { onConflict: "player_id,season_id,squad_id" }
    );

    if (statsError) {
      throw statsError;
    }

    results.push({
      slug,
      squadId,
      seasonId,
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      jerseyNumber: player.number
    });
  }

  return results;
}
