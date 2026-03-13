import Link from "next/link";

import { AdminModal } from "@/components/admin-modal";
import { AdminShell } from "@/components/admin-shell";
import { SquadSwitch } from "@/components/squad-switch";
import { getSiteData, resolveSelectedSquad, sortPlayers } from "@/lib/content";
import { savePlayerStatsAction, saveTeamStatsAction } from "@/lib/admin-actions";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";
import { notFound } from "next/navigation";

function PlayerStatsForm({
  locale,
  redirectTo,
  squadId,
  player
}: {
  locale: string;
  redirectTo: string;
  squadId: string;
  player: (Awaited<ReturnType<typeof getSiteData>>)["players"][number];
}) {
  return (
    <form action={savePlayerStatsAction} className="grid gap-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="playerId" value={player.id} />
      <input type="hidden" name="seasonId" value={player.stats.seasonId || "season-2026"} />
      <input type="hidden" name="squadId" value={player.stats.squadId || squadId} />

      <div className="grid gap-4 md:grid-cols-3">
        <input
          name="gamesPlayed"
          type="number"
          defaultValue={player.stats.gamesPlayed}
          placeholder="Games played"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="avg"
          type="number"
          step="0.001"
          defaultValue={player.stats.avg ?? ""}
          placeholder="AVG"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="obp"
          type="number"
          step="0.001"
          defaultValue={player.stats.obp ?? ""}
          placeholder="OBP"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="slg"
          type="number"
          step="0.001"
          defaultValue={player.stats.slg ?? ""}
          placeholder="SLG"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="ops"
          type="number"
          step="0.001"
          defaultValue={player.stats.ops ?? ""}
          placeholder="OPS"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="homeRuns"
          type="number"
          defaultValue={player.stats.homeRuns ?? ""}
          placeholder="HR"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="runsBattedIn"
          type="number"
          defaultValue={player.stats.runsBattedIn ?? ""}
          placeholder="RBI"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="runs"
          type="number"
          defaultValue={player.stats.runs ?? ""}
          placeholder="Runs"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="stolenBases"
          type="number"
          defaultValue={player.stats.stolenBases ?? ""}
          placeholder="SB"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <input
          name="wins"
          type="number"
          defaultValue={player.stats.wins ?? ""}
          placeholder="Pitcher wins"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="losses"
          type="number"
          defaultValue={player.stats.losses ?? ""}
          placeholder="Pitcher losses"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="era"
          type="number"
          step="0.01"
          defaultValue={player.stats.era ?? ""}
          placeholder="ERA"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="whip"
          type="number"
          step="0.01"
          defaultValue={player.stats.whip ?? ""}
          placeholder="WHIP"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="strikeouts"
          type="number"
          defaultValue={player.stats.strikeouts ?? ""}
          placeholder="Strikeouts"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="saves"
          type="number"
          defaultValue={player.stats.saves ?? ""}
          placeholder="Saves"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>

      <button
        type="submit"
        className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-ink"
      >
        Save player stats
      </button>
    </form>
  );
}

export default async function AdminStatsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string; squad?: string }>;
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
  const players = sortPlayers(
    data.players.filter((player) => player.assignment.squadId === selectedSquad.id)
  );
  const teamStats =
    data.teamStatsBySquad.find(
      (item) => item.seasonId === data.activeSeason.id && item.squadId === selectedSquad.id
    ) ?? data.teamStats;
  const basePath = `/${locale}/admin/stats`;
  const editingPlayer = query.edit ? players.find((player) => player.id === query.edit) : undefined;
  const listPath = `${basePath}?squad=${selectedSquad.id}`;

  return (
    <AdminShell locale={locale} labels={dictionary.admin}>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h2 className="font-[var(--font-display)] text-4xl uppercase tracking-[0.08em] text-white">
              Team stats
            </h2>
            <SquadSwitch
              basePath={basePath}
              squads={data.squads}
              selectedSquadId={selectedSquad.id}
            />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">Wins</p>
              <p className="mt-2 font-[var(--font-display)] text-4xl text-white">{teamStats.wins}</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">Losses</p>
              <p className="mt-2 font-[var(--font-display)] text-4xl text-white">{teamStats.losses}</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">Runs scored</p>
              <p className="mt-2 font-[var(--font-display)] text-4xl text-white">{teamStats.runsScored}</p>
            </div>
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">Runs allowed</p>
              <p className="mt-2 font-[var(--font-display)] text-4xl text-white">{teamStats.runsAllowed}</p>
            </div>
          </div>
        </div>
        <form action={saveTeamStatsAction} className="panel p-6">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="redirectTo" value={listPath} />
          <input type="hidden" name="seasonId" value={data.activeSeason.id} />
          <input type="hidden" name="squadId" value={selectedSquad.id} />
          <h2 className="font-[var(--font-display)] text-4xl uppercase tracking-[0.08em] text-white">
            Update team line
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input name="wins" type="number" defaultValue={teamStats.wins} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <input name="losses" type="number" defaultValue={teamStats.losses} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <input name="runsScored" type="number" defaultValue={teamStats.runsScored} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <input name="runsAllowed" type="number" defaultValue={teamStats.runsAllowed} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <input name="streak" defaultValue={teamStats.streak} placeholder="Streak" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <input name="standing" defaultValue={teamStats.standing} placeholder="Standing" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
          </div>
          <button type="submit" className="mt-6 rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-ink">
            Save team stats
          </button>
        </form>
      </div>

      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="font-[var(--font-display)] text-4xl uppercase tracking-[0.08em] text-white">
              Player stats
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Update batting and pitching numbers for every player from one place.
            </p>
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                  {player.assignment.squadId.toUpperCase()} • #{player.assignment.jerseyNumber} • {player.assignment.position} • {player.role}
                </p>
                <p className="mt-2 font-[var(--font-display)] text-3xl uppercase tracking-[0.08em] text-white">
                  {player.firstName} {player.lastName}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/65">
                  G {player.stats.gamesPlayed}
                </div>
                <Link
                  href={`${basePath}?squad=${selectedSquad.id}&edit=${player.id}`}
                  className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold"
                >
                  Edit stats
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingPlayer && (
        <AdminModal
          title={`Stats: ${editingPlayer.firstName} ${editingPlayer.lastName}`}
          closeHref={listPath}
        >
          <PlayerStatsForm locale={locale} redirectTo={listPath} squadId={selectedSquad.id} player={editingPlayer} />
        </AdminModal>
      )}
    </AdminShell>
  );
}
