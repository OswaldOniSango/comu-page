import Link from "next/link";

import { AdminModal } from "@/components/admin-modal";
import { AdminShell } from "@/components/admin-shell";
import { ImageUploadField } from "@/components/image-upload-field";
import { SeasonSwitch } from "@/components/season-switch";
import { getSiteData, resolveSelectedSeason, resolveSelectedSquad, sortPlayers } from "@/lib/content";
import { copySeasonRosterAction, deletePlayerAction, savePlayerAction, savePlayerEligibilityAction } from "@/lib/admin-actions";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";
import { notFound } from "next/navigation";

function PlayerForm({
  locale,
  redirectTo,
  seasonId,
  squadId,
  submitLabel,
  player,
  squads,
  eligibleSquadIds
}: {
  locale: string;
  redirectTo: string;
  seasonId: string;
  squadId: string;
  submitLabel: string;
  player?: (Awaited<ReturnType<typeof getSiteData>>)["players"][number];
  squads: (Awaited<ReturnType<typeof getSiteData>>)["squads"];
  eligibleSquadIds: string[];
}) {
  return (
    <form action={savePlayerAction} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="id" value={player?.id ?? ""} />
      <input type="hidden" name="seasonId" value={seasonId} />
      <input type="hidden" name="squadId" value={squadId} />
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Ligas habilitadas</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {squads.filter((squad) => squad.isActive).map((squad) => (
            <label key={squad.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
              <input name="eligibleSquads" type="checkbox" value={squad.id} defaultChecked={eligibleSquadIds.includes(squad.id)} className="h-4 w-4 accent-[var(--color-gold)]" />
              {squad.code}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-white/40">El jugador aparecerá en el lineup de los juegos de estas ligas.</p>
      </fieldset>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="firstName"
          required
          defaultValue={player?.firstName ?? ""}
          placeholder="First name"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="lastName"
          required
          defaultValue={player?.lastName ?? ""}
          placeholder="Last name"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <input
          name="jerseyNumber"
          type="number"
          defaultValue={player?.assignment.jerseyNumber ?? ""}
          placeholder="Number"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="position"
          defaultValue={player?.assignment.position ?? ""}
          placeholder="Position"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="bats"
          defaultValue={player?.bats ?? ""}
          placeholder="Bats"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="throws"
          defaultValue={player?.throws ?? ""}
          placeholder="Throws"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <select
          name="role"
          defaultValue={player?.role ?? "hitter"}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        >
          <option className="bg-ink" value="hitter">
            Hitter
          </option>
          <option className="bg-ink" value="pitcher">
            Pitcher
          </option>
          <option className="bg-ink" value="two_way">
            Two way
          </option>
        </select>
        <input
          name="rosterOrder"
          type="number"
          defaultValue={player?.assignment.rosterOrder ?? 99}
          placeholder="Roster order"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>
      <input
        name="hometown"
        defaultValue={player?.hometown ?? ""}
        placeholder="Hometown"
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <div className="grid gap-4">
        <ImageUploadField label="Player photo" name="photoFile" />
        <input
          name="photo"
          defaultValue={player?.photo ?? ""}
          placeholder="Existing photo URL (optional fallback)"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>
      <textarea
        name="bioEs"
        defaultValue={player?.bio.es ?? ""}
        placeholder="Bio ES"
        rows={4}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="bioEn"
        defaultValue={player?.bio.en ?? ""}
        placeholder="Bio EN"
        rows={4}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="quoteEs"
        defaultValue={player?.spotlightQuote?.es ?? ""}
        placeholder="Quote ES"
        rows={2}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="quoteEn"
        defaultValue={player?.spotlightQuote?.en ?? ""}
        placeholder="Quote EN"
        rows={2}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/65">
          <input
            name="featured"
            type="checkbox"
            defaultChecked={player?.assignment.featured ?? false}
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          Featured player
        </label>
        <select
          name="status"
          defaultValue={player?.assignment.status ?? "published"}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        >
          <option className="bg-ink" value="draft">
            Draft
          </option>
          <option className="bg-ink" value="published">
            Published
          </option>
        </select>
      </div>
      <button
        type="submit"
        className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-ink"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default async function AdminPlayersPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string; create?: string; squad?: string; season?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireAdminSession(locale);

  const dictionary = getDictionary(locale);
  const data = await getSiteData();
  const selectedSquad = resolveSelectedSquad(query.squad, data.squads);
  const selectedSeason = resolveSelectedSeason(query.season, data.seasons);
  const leagueFilter = query.squad && data.squads.some((squad) => squad.id === query.squad) ? query.squad : "all";
  const seasonPlayers = data.players.filter((player) => player.assignment.seasonId === selectedSeason.id);
  const allPlayers = sortPlayers(seasonPlayers.filter((player, index, list) => list.findIndex((candidate) => candidate.id === player.id) === index));
  const eligibilityByPlayer = new Map(allPlayers.map((player) => [
    player.id,
    seasonPlayers.filter((candidate) => candidate.id === player.id).map((candidate) => candidate.assignment.squadId)
  ]));
  const players = leagueFilter === "all" ? allPlayers : allPlayers.filter((player) => eligibilityByPlayer.get(player.id)?.includes(leagueFilter));
  const basePath = `/${locale}/admin/players`;
  const editingPlayer = query.edit ? allPlayers.find((player) => player.id === query.edit) : undefined;
  const eligibleSquadIds = editingPlayer
    ? data.players.filter((player) => player.id === editingPlayer.id && player.assignment.seasonId === selectedSeason.id).map((player) => player.assignment.squadId)
    : data.squads.filter((squad) => squad.isActive).map((squad) => squad.id);
  const isCreating = query.create === "1";
  const listPath = `${basePath}?squad=${leagueFilter}&season=${selectedSeason.id}`;

  return (
    <AdminShell locale={locale} labels={dictionary.admin}>
      <div className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-[var(--font-display)] text-3xl uppercase tracking-[0.08em] text-white sm:text-4xl lg:text-5xl">
              {dictionary.admin.playersTitle}
            </h1>
            <p className="mt-3 text-sm text-white/65">{dictionary.admin.playersSubtitle}</p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <SeasonSwitch basePath={basePath} seasons={data.seasons} selectedSeasonId={selectedSeason.id} extraParams={{ squad: leagueFilter }} />
            <Link
              href={`${basePath}?squad=${leagueFilter}&season=${selectedSeason.id}&create=1`}
              className="inline-flex w-full items-center justify-center rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-ink sm:w-auto"
            >
              {dictionary.admin.newPlayer}
            </Link>
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex flex-wrap items-center gap-2">
          {[{ id: "all", code: "Todos" }, ...data.squads.filter((squad) => squad.isActive)].map((squad) => (
            <Link key={squad.id} href={`${basePath}?season=${selectedSeason.id}&squad=${squad.id}`} className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${leagueFilter === squad.id ? "bg-gold text-ink" : "border border-white/10 bg-white/5 text-white/70"}`}>
              {squad.code}
            </Link>
          ))}
          <span className="ml-auto text-xs text-white/45">{players.length} jugador{players.length === 1 ? "" : "es"}</span>
        </div>
      </div>

      <div className="panel p-5">
        <form action={copySeasonRosterAction} className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="targetSeasonId" value={selectedSeason.id} />
          <input type="hidden" name="redirectTo" value={`${basePath}?season=${selectedSeason.id}&squad=all`} />
          <label className="min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Copiar roster de otra temporada</span>
            <select name="sourceSeasonId" required defaultValue="" className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-ink px-4 text-sm text-white outline-none focus:border-gold/50">
              <option value="" disabled>Seleccionar temporada anterior…</option>
              {data.seasons.filter((season) => season.id !== selectedSeason.id).map((season) => (
                <option key={season.id} value={season.id}>{season.label}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={data.seasons.length < 2} className="h-12 rounded-full border border-gold/30 px-5 text-xs font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">
            Copiar a {selectedSeason.label}
          </button>
        </form>
        <p className="mt-3 text-xs leading-5 text-white/45">Copia jugadores y categorías habilitadas. Las estadísticas de la temporada anterior no se copian y los jugadores que ya existen aquí se conservan.</p>
      </div>

      <div className="panel overflow-hidden">
        <div className="divide-y divide-white/10">
          {players.map((player) => (
            <div key={player.id} className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(220px,1fr)_minmax(300px,auto)_auto] lg:items-center">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                  #{player.assignment.jerseyNumber} • {player.assignment.position} • {player.assignment.status}
                </p>
                <p className="mt-2 break-words font-[var(--font-display)] text-2xl uppercase tracking-[0.08em] text-white sm:text-3xl">
                  {player.firstName} {player.lastName}
                </p>
              </div>
              <form action={savePlayerEligibilityAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="redirectTo" value={listPath} />
                <input type="hidden" name="playerId" value={player.id} />
                <input type="hidden" name="seasonId" value={selectedSeason.id} />
                {data.squads.filter((squad) => squad.isActive).map((squad) => (
                  <label key={squad.id} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold uppercase text-white/75 has-[:checked]:border-gold/40 has-[:checked]:bg-gold/10 has-[:checked]:text-gold">
                    <input name="eligibleSquads" type="checkbox" value={squad.id} defaultChecked={eligibilityByPlayer.get(player.id)?.includes(squad.id)} className="h-4 w-4 accent-yellow-400" />
                    {squad.code}
                  </label>
                ))}
                <button type="submit" className="rounded-full bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white hover:bg-gold hover:text-ink">Guardar categorías</button>
              </form>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`${basePath}?squad=${leagueFilter}&season=${selectedSeason.id}&edit=${player.id}`}
                  className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold"
                >
                  {dictionary.admin.edit}
                </Link>
                <form action={deletePlayerAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="redirectTo" value={listPath} />
                  <input type="hidden" name="id" value={player.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-red-200"
                  >
                    {dictionary.admin.delete}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(editingPlayer || isCreating) && (
        <AdminModal
          title={
            editingPlayer
              ? `${dictionary.admin.edit} ${editingPlayer.firstName} ${editingPlayer.lastName}`
              : dictionary.admin.newPlayer
          }
          closeHref={listPath}
          closeLabel={dictionary.admin.close}
        >
          <PlayerForm
            locale={locale}
            redirectTo={listPath}
            seasonId={selectedSeason.id}
            squadId={selectedSquad.id}
            submitLabel={editingPlayer ? dictionary.admin.updatePlayer : dictionary.admin.createPlayer}
            player={editingPlayer}
            squads={data.squads}
            eligibleSquadIds={eligibleSquadIds}
          />
        </AdminModal>
      )}
    </AdminShell>
  );
}
