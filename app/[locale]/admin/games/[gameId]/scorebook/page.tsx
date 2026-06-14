import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminModal } from "@/components/admin-modal";
import { AdminShell } from "@/components/admin-shell";
import { ScorebookEventForm } from "@/components/scorebook-event-form";
import {
  deleteGameBattingEventAction,
  saveGameLineupAction,
  saveOpponentLinescoreAction
} from "@/lib/admin-actions";
import { getAdminGameScorebookPayload, localizeText } from "@/lib/content";
import { formatDate, getDictionary, isLocale } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { GameBattingEvent, Player } from "@/lib/types";

const DEFENSIVE_POSITIONS = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"] as const;

type ScorebookPayload = NonNullable<Awaited<ReturnType<typeof getAdminGameScorebookPayload>>>;

function getPlayerLabel(player: Player) {
  return `#${player.assignment.jerseyNumber} ${player.firstName} ${player.lastName}`;
}

function formatRate(value?: number | null) {
  if (typeof value !== "number") {
    return ".000";
  }

  return value.toFixed(3).replace(/^0/, ".");
}

function getPlayerEventsByInning(events: GameBattingEvent[], playerId: string, inningNumber: number) {
  return events
    .filter((event) => event.batterPlayerId === playerId && event.inningNumber === inningNumber)
    .sort((a, b) => a.sequenceNo - b.sequenceNo);
}

function EventEditorForm({
  locale,
  redirectTo,
  errorRedirectTo,
  gameId,
  seasonId,
  squadId,
  roster,
  battingRoster,
  initialPlayerId,
  initialInningNumber,
  event,
  duplicate,
  errorCode
}: {
  locale: string;
  redirectTo: string;
  errorRedirectTo: string;
  gameId: string;
  seasonId: string;
  squadId: string;
  roster: ScorebookPayload["roster"];
  battingRoster: ScorebookPayload["lineupRoster"];
  initialPlayerId?: string;
  initialInningNumber?: number;
  event?: GameBattingEvent;
  duplicate?: boolean;
  errorCode?: string;
}) {
  return (
    <ScorebookEventForm
      locale={locale}
      redirectTo={redirectTo}
      errorRedirectTo={errorRedirectTo}
      gameId={gameId}
      seasonId={seasonId}
      squadId={squadId}
      roster={roster}
      battingRoster={battingRoster}
      initialPlayerId={initialPlayerId}
      initialInningNumber={initialInningNumber}
      event={event}
      duplicate={duplicate}
      errorCode={errorCode}
    />
  );
}

function LineupManagerForm({
  locale,
  redirectTo,
  gameId,
  roster,
  lineup
}: {
  locale: string;
  redirectTo: string;
  gameId: string;
  roster: ScorebookPayload["roster"];
  lineup: ScorebookPayload["lineup"];
}) {
  return (
    <form action={saveGameLineupAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="gameId" value={gameId} />

      <div className="grid grid-cols-[52px_minmax(0,1fr)_88px] gap-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
        <div>#</div>
        <div>Jugador</div>
        <div>Pos</div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 9 }, (_, index) => index + 1).map((spot) => {
          const entry = lineup.find((item) => item.battingOrder === spot);
          return (
            <div key={spot} className="grid grid-cols-[52px_minmax(0,1fr)_88px] gap-2">
              <div className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-sm font-semibold text-gold">
                {spot}
              </div>
              <select
                name={`lineupPlayer_${spot}`}
                defaultValue={entry?.playerId ?? ""}
                className="h-12 min-w-0 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-gold/50"
              >
                <option className="bg-ink" value="">
                  Sin asignar
                </option>
                {roster.map((player) => (
                  <option key={player.id} value={player.id} className="bg-ink">
                    {getPlayerLabel(player)}
                  </option>
                ))}
              </select>
              <select
                name={`lineupPosition_${spot}`}
                defaultValue={entry?.defensivePosition ?? "DH"}
                className="h-12 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-gold/50"
              >
                {DEFENSIVE_POSITIONS.map((position) => (
                  <option key={position} value={position} className="bg-ink">
                    {position}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
      >
        Guardar lineup
      </button>
    </form>
  );
}

export default async function AdminGameScorebookPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; gameId: string }>;
  searchParams: Promise<{
    tab?: string;
    edit?: string;
    duplicate?: string;
    createPlayer?: string;
    createInning?: string;
    error?: string;
  }>;
}) {
  const { locale, gameId } = await params;
  const query = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  await requireAdminSession(locale);

  const dictionary = getDictionary(locale);
  const payload = await getAdminGameScorebookPayload(gameId);
  if (!payload) {
    notFound();
  }

  const {
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
    snapshot
  } = payload;
  const activeTab = query.tab === "planilla" ? "planilla" : "resumen";
  const editingEvent = events.find((event) => event.id === query.edit);
  const duplicateEvent = events.find((event) => event.id === query.duplicate);
  const creatingPlayerId = query.createPlayer || "";
  const creatingInningNumber = Number(query.createInning || 0) || undefined;
  const maxInning = Math.max(
    9,
    ...events.map((event) => event.inningNumber),
    ...opponentLines.map((line) => line.inningNumber)
  );
  const innings = Array.from({ length: maxInning }, (_, index) => index + 1);
  const basePath = `/${locale}/admin/games/${gameId}/scorebook`;
  const summaryPath = `${basePath}?tab=resumen`;
  const boardPath = `${basePath}?tab=planilla`;
  const editorPath = editingEvent
    ? `${basePath}?tab=${activeTab}&edit=${editingEvent.id}`
    : duplicateEvent
      ? `${basePath}?tab=${activeTab}&duplicate=${duplicateEvent.id}`
      : creatingPlayerId && creatingInningNumber
        ? `${basePath}?tab=${activeTab}&createPlayer=${creatingPlayerId}&createInning=${creatingInningNumber}`
        : `${basePath}?tab=${activeTab}`;

  return (
    <AdminShell locale={locale} labels={dictionary.admin}>
      {!isSupabaseConfigured() ? (
        <div className="panel border-gold/20 bg-gold/10 p-6 text-sm text-white/75">
          Scorebook requiere Supabase configurado. En seed mode no se simulan anotaciones persistentes.
        </div>
      ) : null}

      {game.squadId !== "a1" ? (
        <div className="panel border-gold/20 bg-gold/10 p-6 text-sm text-white/75">
          Esta primera versión solo está habilitada para Comu A1.
        </div>
      ) : null}

      <section className="panel-dark p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Scorebook Comu A1
            </p>
            <h1 className="font-[var(--font-display)] text-3xl uppercase tracking-[0.05em] text-white md:text-4xl">
              vs {game.opponent}
            </h1>
            <p className="text-sm text-white/65">
              {formatDate(game.startsAt, locale)} • {game.venue} • {game.isHome ? "Local" : "Visitante"}
            </p>
          </div>
          <Link
            href={`/${locale}/admin/games?squad=${game.squadId}`}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75 hover:border-gold hover:text-gold"
          >
            Volver a juegos
          </Link>
        </div>

        <form
          action={saveOpponentLinescoreAction}
          className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/25 p-5"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="redirectTo" value={`${basePath}?tab=${activeTab}`} />
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="seasonId" value={game.seasonId} />
          <input type="hidden" name="squadId" value={game.squadId} />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Score Horizontal
              </p>
              <p className="mt-1 text-sm text-white/65">
                Edita los innings de ambos equipos y guarda el score directamente desde esta tabla.
              </p>
            </div>
            <button
              type="submit"
              className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
            >
              Guardar score
            </button>
          </div>

          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[96px_repeat(9,minmax(48px,1fr))_56px_56px_56px] gap-2 text-center">
                <div />
                {innings.slice(0, 9).map((inning) => (
                  <div key={`head-${inning}`} className="text-sm font-semibold text-white/65">
                    {inning}
                  </div>
                ))}
                {["C", "H", "E"].map((label) => (
                  <div key={label} className="text-sm font-semibold text-white/65">
                    {label}
                  </div>
                ))}

                <input
                  name="opponentAbbreviation"
                  defaultValue={scoreboard.opponentAbbreviation}
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center text-lg font-semibold text-white"
                />
                {innings.slice(0, 9).map((inning) => (
                  <input
                    key={`opp-${inning}`}
                    name={`opponentRuns_${inning}`}
                    type="number"
                    min={0}
                    defaultValue={opponentLines.find((line) => line.inningNumber === inning)?.runs ?? 0}
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center text-lg text-white"
                  />
                ))}
                <div className="flex items-center justify-center text-2xl font-semibold text-white">
                  {snapshot.opponentRuns}
                </div>
                <input
                  name="opponentHits"
                  type="number"
                  min={0}
                  defaultValue={scoreboard.opponentHits}
                  className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center text-lg text-white"
                />
                <input
                  name="opponentErrors"
                  type="number"
                  min={0}
                  defaultValue={scoreboard.opponentErrors}
                  className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center text-lg text-white"
                />

                <input
                  name="comuAbbreviation"
                  defaultValue={scoreboard.comuAbbreviation}
                  className="rounded-lg border border-gold/20 bg-gold/10 px-3 py-2 text-center text-lg font-semibold text-gold"
                />
                {innings.slice(0, 9).map((inning) => (
                  <input
                    key={`comu-${inning}`}
                    name={`comuRuns_${inning}`}
                    type="number"
                    min={0}
                    defaultValue={comuRunsByInning.get(inning) ?? 0}
                    className="rounded-lg border border-gold/20 bg-gold/10 px-2 py-2 text-center text-lg font-semibold text-gold"
                  />
                ))}
                <div className="flex items-center justify-center text-2xl font-semibold text-gold">
                  {snapshot.comuRuns}
                </div>
                <div className="flex items-center justify-center text-2xl font-semibold text-gold">
                  {comuHitTotal}
                </div>
                <input
                  name="comuErrors"
                  type="number"
                  min={0}
                  defaultValue={scoreboard.comuErrors}
                  className="rounded-lg border border-gold/20 bg-gold/10 px-2 py-2 text-center text-lg text-gold"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Inning actual
            </p>
            <p className="mt-2 font-[var(--font-display)] text-4xl text-white">{snapshot.currentInning}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Outs</p>
            <p className="mt-2 font-[var(--font-display)] text-4xl text-white">{snapshot.outs}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Bases</p>
            <p className="mt-2 text-sm text-white/70">
              1B {snapshot.bases.first ? "ocupada" : "vacía"} • 2B {snapshot.bases.second ? "ocupada" : "vacía"} • 3B {snapshot.bases.third ? "ocupada" : "vacía"}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gold">
              {snapshot.recentNotations.length ? snapshot.recentNotations.join(" • ") : "Sin jugadas"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={summaryPath}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
              activeTab === "resumen" ? "bg-gold text-ink" : "border border-white/10 text-white/70"
            }`}
          >
            Resumen
          </Link>
          <Link
            href={boardPath}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
              activeTab === "planilla" ? "bg-gold text-ink" : "border border-white/10 text-white/70"
            }`}
          >
            Planilla
          </Link>
        </div>
      </section>

      {isSupabaseConfigured() && game.squadId === "a1" ? (
        <div className={`grid gap-6 ${activeTab === "planilla" ? "2xl:grid-cols-[minmax(0,1fr)_340px]" : "xl:grid-cols-[minmax(0,1.3fr)_360px]"}`}>
          <div className="min-w-0 space-y-6">
            {activeTab === "resumen" ? (
              <section className="panel p-6">
                <div className="mb-5">
                  <h2 className="font-[var(--font-display)] text-2xl uppercase tracking-[0.05em] text-white">
                    Resumen del juego
                  </h2>
                  <p className="mt-2 text-sm text-white/65">
                    Desde aquí revisas el estado general. Las jugadas nuevas se cargan directamente desde la planilla.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      Ultima jugada
                    </p>
                    <p className="mt-2 text-base text-white">{snapshot.lastNotation || "Sin jugadas"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      Turnos cargados
                    </p>
                    <p className="mt-2 text-base text-white">{events.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      Headline
                    </p>
                    <p className="mt-2 text-sm text-white/75">
                      {localizeText(locale, game.headline) || "Sin titular"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      Summary
                    </p>
                    <p className="mt-2 text-sm text-white/75">
                      {localizeText(locale, game.summary) || "Sin resumen"}
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <section className="panel p-6">
                <div className="mb-5">
                  <h2 className="font-[var(--font-display)] text-2xl uppercase tracking-[0.05em] text-white">
                    Hoja horizontal
                  </h2>
                  <p className="mt-2 text-sm text-white/65">
                    El lineup queda a la izquierda, cada inning al centro y las stats del juego al final.
                  </p>
                </div>

                {lineup.length ? (
                  <div className="max-w-full overflow-x-auto pb-2">
                    <p className="mb-4 text-xs uppercase tracking-[0.18em] text-white/45">
                      Desliza horizontalmente para ver innings y totales.
                    </p>
                    <table className="min-w-[1280px] border-separate border-spacing-y-2 text-sm">
                      <thead>
                        <tr className="text-left text-white/65">
                          <th className="w-12 px-2 py-2 font-semibold">#</th>
                          <th className="w-[240px] px-2 py-2 font-semibold">
                            Bateadores - {scoreboard.comuAbbreviation}
                          </th>
                          <th className="w-16 px-2 py-2 text-center font-semibold">Pos</th>
                          {innings.map((inning) => (
                            <th key={`inning-head-${inning}`} className="w-[76px] px-1 py-2 text-center font-semibold">
                              {inning}
                            </th>
                          ))}
                          {["AB", "R", "H", "RBI", "BB", "K", "AVG", "OPS"].map((label) => (
                            <th key={label} className="w-[58px] px-1 py-2 text-center font-semibold">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lineup.map((entry) => {
                          const player = roster.find((item) => item.id === entry.playerId);
                          const line = gameBattingLines[entry.playerId];

                          return (
                            <tr key={`${entry.battingOrder}-${entry.playerId}`}>
                              <td className="rounded-l-xl border border-white/10 bg-black/25 px-2 py-3 text-center font-semibold text-gold">
                                {entry.battingOrder}
                              </td>
                              <td className="border-y border-white/10 bg-black/25 px-3 py-3 text-white">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">
                                    {player ? `${player.lastName}, ${player.firstName}` : "Jugador"}
                                  </p>
                                  <p className="mt-1 text-xs text-white/45">
                                    {player ? `#${player.assignment.jerseyNumber}` : ""}
                                  </p>
                                </div>
                              </td>
                              <td className="border-y border-white/10 bg-black/25 px-2 py-3 text-center text-white/75">
                                {entry.defensivePosition}
                              </td>
                              {innings.map((inning) => {
                                const inningEvents = getPlayerEventsByInning(events, entry.playerId, inning);

                                return (
                                  <td
                                    key={`${entry.playerId}-inning-${inning}`}
                                    className="border-y border-white/10 bg-black/20 px-1 py-2"
                                  >
                                    {inningEvents.length ? (
                                      <div className="flex min-h-[56px] flex-col justify-center gap-1">
                                        {inningEvents.map((event) => (
                                          <Link
                                            key={event.id}
                                            href={`${basePath}?tab=planilla&edit=${event.id}`}
                                            className="rounded-md border border-gold/20 bg-gold/10 px-1 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-gold transition hover:border-gold/40"
                                          >
                                            {event.notation}
                                          </Link>
                                        ))}
                                      </div>
                                    ) : (
                                      <Link
                                        href={`${basePath}?tab=planilla&createPlayer=${entry.playerId}&createInning=${inning}`}
                                        className="flex min-h-[56px] items-center justify-center rounded-md border border-dashed border-white/10 text-white/20 transition hover:border-gold/30 hover:text-gold"
                                      >
                                        +
                                      </Link>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="border-y border-white/10 bg-black/25 px-1 py-3 text-center text-white">
                                {line?.atBats ?? 0}
                              </td>
                              <td className="border-y border-white/10 bg-black/25 px-1 py-3 text-center text-white">
                                {line?.runs ?? 0}
                              </td>
                              <td className="border-y border-white/10 bg-black/25 px-1 py-3 text-center text-white">
                                {line?.hits ?? 0}
                              </td>
                              <td className="border-y border-white/10 bg-black/25 px-1 py-3 text-center text-white">
                                {line?.runsBattedIn ?? 0}
                              </td>
                              <td className="border-y border-white/10 bg-black/25 px-1 py-3 text-center text-white">
                                {line?.walks ?? 0}
                              </td>
                              <td className="border-y border-white/10 bg-black/25 px-1 py-3 text-center text-white">
                                {line?.strikeouts ?? 0}
                              </td>
                              <td className="border-y border-white/10 bg-black/25 px-1 py-3 text-center text-white">
                                {formatRate(line?.avg)}
                              </td>
                              <td className="rounded-r-xl border border-white/10 bg-black/25 px-1 py-3 text-center text-white">
                                {formatRate(line?.ops)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="text-sm font-semibold">
                          <td className="px-2 pt-3 text-white">Totales</td>
                          <td />
                          <td />
                          {innings.map((inning) => (
                            <td key={`total-inning-${inning}`} className="px-1 pt-3 text-center text-gold">
                              {comuRunsByInning.get(inning) ?? 0}
                            </td>
                          ))}
                          <td className="px-1 pt-3 text-center text-white">
                            {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.atBats ?? 0), 0)}
                          </td>
                          <td className="px-1 pt-3 text-center text-white">
                            {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.runs ?? 0), 0)}
                          </td>
                          <td className="px-1 pt-3 text-center text-white">
                            {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.hits ?? 0), 0)}
                          </td>
                          <td className="px-1 pt-3 text-center text-white">
                            {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.runsBattedIn ?? 0), 0)}
                          </td>
                          <td className="px-1 pt-3 text-center text-white">
                            {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.walks ?? 0), 0)}
                          </td>
                          <td className="px-1 pt-3 text-center text-white">
                            {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.strikeouts ?? 0), 0)}
                          </td>
                          <td />
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-white/45">
                    Guarda un lineup para ver y anotar la hoja horizontal por jugador e inning.
                  </div>
                )}
              </section>
            )}

            <section className="panel overflow-hidden">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="font-[var(--font-display)] text-2xl uppercase tracking-[0.05em] text-white">
                  Últimas jugadas
                </h2>
              </div>
              <div className="divide-y divide-white/10">
                {events.length ? (
                  events
                    .slice()
                    .reverse()
                    .map((event) => {
                      const batter = roster.find((player) => player.id === event.batterPlayerId);
                      return (
                        <div key={event.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                              Inning {event.inningNumber} • Outs {event.outsBefore} • PA {event.sequenceNo}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <span className="rounded-full bg-gold px-3 py-1 text-sm font-semibold text-ink">
                                {event.notation}
                              </span>
                              <p className="text-sm text-white/75">
                                {batter ? `${batter.firstName} ${batter.lastName}` : "Jugador"}
                              </p>
                            </div>
                            <p className="mt-2 text-sm text-white/55">{event.notes || "Sin notas"}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`${basePath}?tab=${activeTab}&edit=${event.id}`}
                              className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold"
                            >
                              Editar
                            </Link>
                            <Link
                              href={`${basePath}?tab=${activeTab}&duplicate=${event.id}`}
                              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75"
                            >
                              Duplicar
                            </Link>
                            <form action={deleteGameBattingEventAction}>
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="redirectTo" value={`${basePath}?tab=${activeTab}`} />
                              <input type="hidden" name="gameId" value={game.id} />
                              <input type="hidden" name="seasonId" value={game.seasonId} />
                              <input type="hidden" name="squadId" value={game.squadId} />
                              <input type="hidden" name="id" value={event.id} />
                              <button
                                type="submit"
                                className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-200"
                              >
                                Eliminar
                              </button>
                            </form>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="px-5 py-8 text-sm text-white/60">
                    Todavía no hay jugadas cargadas para este partido.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-6">
            <section className="panel p-6">
              <div className="mb-5">
                <h2 className="font-[var(--font-display)] text-2xl uppercase tracking-[0.05em] text-white">
                  Lineup del juego
                </h2>
                <p className="mt-2 text-sm text-white/65">
                  Define el orden al bate y la posición defensiva de este partido.
                </p>
              </div>
              <LineupManagerForm
                locale={locale}
                redirectTo={`${basePath}?tab=${activeTab}`}
                gameId={game.id}
                roster={roster}
                lineup={lineup}
              />
            </section>

            {activeTab === "planilla" ? (
              <section className="panel p-6">
                <h2 className="font-[var(--font-display)] text-2xl uppercase tracking-[0.05em] text-white">
                  Acciones
                </h2>
                <div className="mt-5 space-y-4 text-sm text-white/70">
                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      Como cargar
                    </p>
                    <p className="mt-2 text-sm text-white/75">
                      Haz click en una celda vacía para crear una jugada en ese inning y jugador. Haz click en una anotación existente para editarla.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      Última jugada
                    </p>
                    <p className="mt-2 text-base text-white">{snapshot.lastNotation || "Sin jugadas"}</p>
                  </div>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      ) : null}

      {(editingEvent || duplicateEvent || (creatingPlayerId && creatingInningNumber)) &&
      isSupabaseConfigured() &&
      game.squadId === "a1" ? (
        <AdminModal
          title={
            editingEvent
              ? `Editar ${editingEvent.notation}`
              : duplicateEvent
                ? `Duplicar ${duplicateEvent?.notation}`
                : "Nueva jugada"
          }
          closeHref={`${basePath}?tab=${activeTab}`}
        >
          <EventEditorForm
            locale={locale}
            redirectTo={`${basePath}?tab=${activeTab}`}
            errorRedirectTo={editorPath}
            gameId={game.id}
            seasonId={game.seasonId}
            squadId={game.squadId}
            roster={roster}
            battingRoster={lineupRoster}
            initialPlayerId={creatingPlayerId}
            initialInningNumber={creatingInningNumber}
            event={editingEvent ?? duplicateEvent}
            duplicate={Boolean(duplicateEvent && !editingEvent)}
            errorCode={query.error}
          />
        </AdminModal>
      ) : null}
    </AdminShell>
  );
}
