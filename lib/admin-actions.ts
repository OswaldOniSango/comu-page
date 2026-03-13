"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fromLocalDateTimeInput } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Locale, PlayerRole, PostKind, PublishStatus } from "@/lib/types";

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
