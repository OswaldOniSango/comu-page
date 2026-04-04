import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminModal } from "@/components/admin-modal";
import { AdminShell } from "@/components/admin-shell";
import {
  deleteGameBattingEventAction,
  saveGameBattingEventAction,
  saveGameLineupAction,
  saveOpponentLinescoreAction
} from "@/lib/admin-actions";
import { getAdminGameScorebookPayload, localizeText } from "@/lib/content";
import { formatDate, getDictionary, isLocale } from "@/lib/i18n";
import { getDefaultDestinationForEvent } from "@/lib/scorebook";
import { requireAdminSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { BaseDestination, GameBattingEvent, Player, ScorebookEventCode } from "@/lib/types";

const EVENT_OPTIONS: Array<{ value: ScorebookEventCode; label: string }> = [
  { value: "single", label: "Hit al OF" },
  { value: "double", label: "Doble" },
  { value: "triple", label: "Triple" },
  { value: "home_run", label: "Home run" },
  { value: "bb", label: "Base por bolas" },
  { value: "hbp", label: "Golpeado" },
  { value: "k", label: "Ponche" },
  { value: "go", label: "Out en el cuadro" },
  { value: "fo", label: "Fly out" },
  { value: "lo", label: "Line out" },
  { value: "e", label: "Error" },
  { value: "fc", label: "Fielder's choice" },
  { value: "sf", label: "Sacrifice fly" },
  { value: "sh", label: "Sacrifice bunt" },
  { value: "dp", label: "Double play" }
];

const ADVANCE_OPTIONS: Array<{ value: BaseDestination; label: string }> = [
  { value: "1", label: "1B" },
  { value: "2", label: "2B" },
  { value: "3", label: "3B" },
  { value: "H", label: "Home" },
  { value: "O", label: "Out" }
];

const DEFENSIVE_POSITIONS = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"] as const;

type ScorebookPayload = NonNullable<Awaited<ReturnType<typeof getAdminGameScorebookPayload>>>;

function fieldClassName() {
  return "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-gold/50";
}

function labelClassName() {
  return "grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55";
}

function panelSectionClassName() {
  return "rounded-[1.5rem] border border-white/10 bg-black/25 p-5";
}

function getAdvanceFor(event: GameBattingEvent | undefined, startBase: "B" | "1" | "2" | "3") {
  return event?.runnerAdvances.find((advance) => advance.startBase === startBase)?.endBase;
}

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
  gameId,
  seasonId,
  squadId,
  roster,
  battingRoster,
  event,
  duplicate
}: {
  locale: string;
  redirectTo: string;
  gameId: string;
  seasonId: string;
  squadId: string;
  roster: ScorebookPayload["roster"];
  battingRoster: ScorebookPayload["lineupRoster"];
  event?: GameBattingEvent;
  duplicate?: boolean;
}) {
  const selectedEventCode = event?.eventCode ?? "single";
  const defaultAdvance = getDefaultDestinationForEvent(selectedEventCode);

  return (
    <form action={saveGameBattingEventAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="seasonId" value={seasonId} />
      <input type="hidden" name="squadId" value={squadId} />
      <input type="hidden" name="id" value={duplicate ? "" : event?.id ?? ""} />
      <input type="hidden" name="defaultAdvanceBatter" value={defaultAdvance} />

      <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)_120px]">
        <label className={labelClassName()}>
          Inning
          <input
            name="inningNumber"
            type="number"
            min={1}
            defaultValue={event?.inningNumber ?? 1}
            className={fieldClassName()}
          />
        </label>
        <label className={labelClassName()}>
          Bateador
          <select
            name="batterPlayerId"
            defaultValue={event?.batterPlayerId ?? battingRoster[0]?.id ?? roster[0]?.id ?? ""}
            className={fieldClassName()}
          >
            {battingRoster.map((player) => (
              <option key={player.id} value={player.id} className="bg-ink">
                {getPlayerLabel(player)}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName()}>
          Outs Antes
          <select
            name="outsBefore"
            defaultValue={String(event?.outsBefore ?? 0)}
            className={fieldClassName()}
          >
            <option className="bg-ink" value="0">
              0
            </option>
            <option className="bg-ink" value="1">
              1
            </option>
            <option className="bg-ink" value="2">
              2
            </option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_140px_220px]">
        <label className={labelClassName()}>
          Resultado
          <select name="eventCode" defaultValue={selectedEventCode} className={fieldClassName()}>
            {EVENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-ink">
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName()}>
          Zona
          <select name="hitZone" defaultValue={event?.hitZone ?? "7"} className={fieldClassName()}>
            <option className="bg-ink" value="">
              N/A
            </option>
            <option className="bg-ink" value="7">
              7
            </option>
            <option className="bg-ink" value="8">
              8
            </option>
            <option className="bg-ink" value="9">
              9
            </option>
          </select>
        </label>
        <label className={labelClassName()}>
          Ruta Defensiva
          <input
            name="fielderPath"
            defaultValue={event?.fielderPath ?? ""}
            placeholder="63, F8, 5-4-3"
            className={fieldClassName()}
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <section className={panelSectionClassName()}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Bases antes de la jugada</h3>
              <p className="mt-1 text-sm text-white/55">
                Marca quién estaba en base antes del turno.
              </p>
            </div>
            <div className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Contexto previo
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {([
              { name: "baseFirstPlayerId", label: "1B" },
              { name: "baseSecondPlayerId", label: "2B" },
              { name: "baseThirdPlayerId", label: "3B" }
            ] as const).map((base) => (
              <label key={base.name} className={labelClassName()}>
                {base.label}
                <select
                  name={base.name}
                  defaultValue={
                    base.name === "baseFirstPlayerId"
                      ? event?.basesBefore.first ?? ""
                      : base.name === "baseSecondPlayerId"
                        ? event?.basesBefore.second ?? ""
                        : event?.basesBefore.third ?? ""
                  }
                  className={fieldClassName()}
                >
                  <option className="bg-ink" value="">
                    Base vacía
                  </option>
                  {roster.map((player) => (
                    <option key={player.id} value={player.id} className="bg-ink">
                      {getPlayerLabel(player)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>

        <section className={panelSectionClassName()}>
          <h3 className="text-lg font-semibold text-white">Guía rápida</h3>
          <div className="mt-4 space-y-3 text-sm text-white/65">
            <p>`H7` hit al left.</p>
            <p>`H8` hit al center.</p>
            <p>`H9` hit al right.</p>
            <p>`63` rola short a primera.</p>
            <p>`BB` base por bolas.</p>
          </div>
        </section>
      </div>

      <section className={panelSectionClassName()}>
        <div>
          <h3 className="text-lg font-semibold text-white">Avance de corredores</h3>
          <p className="mt-1 text-sm text-white/55">
            Define cómo terminó cada corredor después de la jugada.
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {([
            { name: "advanceBatter", label: "Bateador", startBase: "B" },
            { name: "advanceFirst", label: "Runner en 1B", startBase: "1" },
            { name: "advanceSecond", label: "Runner en 2B", startBase: "2" },
            { name: "advanceThird", label: "Runner en 3B", startBase: "3" }
          ] as const).map((advance) => (
            <label key={advance.name} className={labelClassName()}>
              {advance.label}
              <select
                name={advance.name}
                defaultValue={getAdvanceFor(event, advance.startBase) ?? defaultAdvance}
                className={fieldClassName()}
              >
                {ADVANCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-ink">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
        <label className={labelClassName()}>
          RBI
          <input
            name="rbiCount"
            type="number"
            min={0}
            defaultValue={event?.rbiCount ?? 0}
            className={fieldClassName()}
          />
        </label>
        <label className={labelClassName()}>
          Notas
          <textarea
            name="notes"
            defaultValue={event?.notes ?? ""}
            rows={3}
            placeholder="Detalle opcional de la jugada"
            className={fieldClassName()}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-gold/20 bg-gold/5 px-4 py-4">
        <p className="text-sm text-white/65">
          La notación se genera automáticamente usando resultado, zona y ruta defensiva.
        </p>
        <button
          type="submit"
          className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
        >
          {event && !duplicate ? "Guardar jugada" : "Agregar jugada"}
        </button>
      </div>
    </form>
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

      <div className="space-y-3">
        {Array.from({ length: 9 }, (_, index) => index + 1).map((spot) => {
          const entry = lineup.find((item) => item.battingOrder === spot);
          return (
            <div key={spot} className="grid gap-3 sm:grid-cols-[56px_minmax(0,1fr)_92px]">
              <div className="flex items-center justify-center rounded-xl border border-white/10 bg-black/25 text-sm font-semibold text-gold">
                {spot}
              </div>
              <select
                name={`lineupPlayer_${spot}`}
                defaultValue={entry?.playerId ?? ""}
                className={fieldClassName()}
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
                className={fieldClassName()}
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
  searchParams: Promise<{ tab?: string; edit?: string; duplicate?: string }>;
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
  const activeTab = query.tab === "planilla" ? "planilla" : "captura";
  const editingEvent = events.find((event) => event.id === query.edit);
  const duplicateEvent = events.find((event) => event.id === query.duplicate);
  const maxInning = Math.max(
    9,
    ...events.map((event) => event.inningNumber),
    ...opponentLines.map((line) => line.inningNumber)
  );
  const innings = Array.from({ length: maxInning }, (_, index) => index + 1);
  const basePath = `/${locale}/admin/games/${gameId}/scorebook`;
  const capturePath = `${basePath}?tab=captura`;
  const boardPath = `${basePath}?tab=planilla`;

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
                Edita el rival aquí arriba y guarda el score directamente desde esta tabla.
              </p>
            </div>
            <button
              type="submit"
              className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
            >
              Guardar score
            </button>
          </div>

          <div className="overflow-x-auto">
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
                  <div
                    key={`comu-${inning}`}
                    className="flex items-center justify-center rounded-lg border border-gold/10 bg-gold/5 px-2 py-2 text-2xl font-semibold text-gold"
                  >
                    {comuRunsByInning.get(inning) ?? 0}
                  </div>
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
            href={capturePath}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
              activeTab === "captura" ? "bg-gold text-ink" : "border border-white/10 text-white/70"
            }`}
          >
            Captura
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <div className="space-y-6">
            {activeTab === "captura" ? (
              <section className="panel p-6">
                <div className="mb-5">
                  <h2 className="font-[var(--font-display)] text-2xl uppercase tracking-[0.05em] text-white">
                    Cargar jugada
                  </h2>
                  <p className="mt-2 text-sm text-white/65">
                    Primero selecciona el bateador, luego el resultado y finalmente el avance de corredores.
                  </p>
                </div>
                <EventEditorForm
                  locale={locale}
                  redirectTo={capturePath}
                  gameId={game.id}
                  seasonId={game.seasonId}
                  squadId={game.squadId}
                  roster={roster}
                  battingRoster={lineupRoster}
                />
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
                  <div className="overflow-x-auto">
                    <div className="min-w-[1550px]">
                      <div
                        className="grid gap-x-2 gap-y-3 text-sm"
                        style={{
                          gridTemplateColumns: `56px minmax(220px,1.6fr) 64px repeat(${innings.length}, minmax(72px, 1fr)) 56px repeat(8, 58px)`
                        }}
                      >
                        <div className="font-semibold text-white/65">#</div>
                        <div className="font-semibold text-white/65">Bateadores - {scoreboard.comuAbbreviation}</div>
                        <div className="text-center font-semibold text-white/65">Pos</div>
                        {innings.map((inning) => (
                          <div key={`inning-head-${inning}`} className="text-center font-semibold text-white/65">
                            {inning}
                          </div>
                        ))}
                        <div className="text-center font-semibold text-white/65">AB</div>
                        <div className="text-center font-semibold text-white/65">R</div>
                        <div className="text-center font-semibold text-white/65">H</div>
                        <div className="text-center font-semibold text-white/65">RBI</div>
                        <div className="text-center font-semibold text-white/65">BB</div>
                        <div className="text-center font-semibold text-white/65">K</div>
                        <div className="text-center font-semibold text-white/65">AVG</div>
                        <div className="text-center font-semibold text-white/65">OPS</div>

                        {lineup.map((entry) => {
                          const player = roster.find((item) => item.id === entry.playerId);
                          const line = gameBattingLines[entry.playerId];

                          return (
                            <div key={`${entry.battingOrder}-${entry.playerId}`} className="contents">
                              <div className="flex items-center justify-center rounded-lg border border-white/10 bg-black/25 text-sm font-semibold text-gold">
                                {entry.battingOrder}
                              </div>
                              <div className="flex items-center rounded-lg border border-white/10 bg-black/25 px-3 py-3 text-white">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">
                                    {player ? `${player.lastName}, ${player.firstName}` : "Jugador"}
                                  </p>
                                  <p className="mt-1 text-xs text-white/45">
                                    {player ? `#${player.assignment.jerseyNumber}` : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-center rounded-lg border border-white/10 bg-black/25 text-white/75">
                                {entry.defensivePosition}
                              </div>

                              {innings.map((inning) => {
                                const inningEvents = getPlayerEventsByInning(events, entry.playerId, inning);

                                return (
                                  <div
                                    key={`${entry.playerId}-inning-${inning}`}
                                    className="min-h-[74px] rounded-lg border border-white/10 bg-black/20 p-2"
                                  >
                                    {inningEvents.length ? (
                                      <div className="flex h-full flex-col justify-center gap-1">
                                        {inningEvents.map((event) => (
                                          <Link
                                            key={event.id}
                                            href={`${basePath}?tab=planilla&edit=${event.id}`}
                                            className="rounded-md border border-gold/20 bg-gold/10 px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-gold transition hover:border-gold/40"
                                          >
                                            {event.notation}
                                          </Link>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-white/20">•</div>
                                    )}
                                  </div>
                                );
                              })}

                              <div className="flex items-center justify-center text-white">{line?.atBats ?? 0}</div>
                              <div className="flex items-center justify-center text-white">{line?.runs ?? 0}</div>
                              <div className="flex items-center justify-center text-white">{line?.hits ?? 0}</div>
                              <div className="flex items-center justify-center text-white">{line?.runsBattedIn ?? 0}</div>
                              <div className="flex items-center justify-center text-white">{line?.walks ?? 0}</div>
                              <div className="flex items-center justify-center text-white">{line?.strikeouts ?? 0}</div>
                              <div className="flex items-center justify-center text-white">{formatRate(line?.avg)}</div>
                              <div className="flex items-center justify-center text-white">{formatRate(line?.ops)}</div>
                            </div>
                          );
                        })}

                        <div className="pt-4 font-semibold text-white">Totales</div>
                        <div />
                        <div />
                        {innings.map((inning) => (
                          <div key={`total-inning-${inning}`} className="flex items-center justify-center pt-4 font-semibold text-gold">
                            {comuRunsByInning.get(inning) ?? 0}
                          </div>
                        ))}
                        <div className="flex items-center justify-center pt-4 font-semibold text-white">
                          {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.atBats ?? 0), 0)}
                        </div>
                        <div className="flex items-center justify-center pt-4 font-semibold text-white">
                          {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.runs ?? 0), 0)}
                        </div>
                        <div className="flex items-center justify-center pt-4 font-semibold text-white">
                          {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.hits ?? 0), 0)}
                        </div>
                        <div className="flex items-center justify-center pt-4 font-semibold text-white">
                          {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.runsBattedIn ?? 0), 0)}
                        </div>
                        <div className="flex items-center justify-center pt-4 font-semibold text-white">
                          {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.walks ?? 0), 0)}
                        </div>
                        <div className="flex items-center justify-center pt-4 font-semibold text-white">
                          {lineup.reduce((total, entry) => total + (gameBattingLines[entry.playerId]?.strikeouts ?? 0), 0)}
                        </div>
                        <div />
                        <div />
                      </div>
                    </div>
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

          <aside className="space-y-6">
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

            <section className="panel p-6">
              <h2 className="font-[var(--font-display)] text-2xl uppercase tracking-[0.05em] text-white">
                Resumen
              </h2>
              <div className="mt-5 space-y-4 text-sm text-white/70">
                <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Última jugada
                  </p>
                  <p className="mt-2 text-base text-white">
                    {snapshot.lastNotation || "Sin jugadas"}
                  </p>
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
          </aside>
        </div>
      ) : null}

      {(editingEvent || duplicateEvent) && isSupabaseConfigured() && game.squadId === "a1" ? (
        <AdminModal
          title={editingEvent ? `Editar ${editingEvent.notation}` : `Duplicar ${duplicateEvent?.notation}`}
          closeHref={`${basePath}?tab=${activeTab}`}
        >
          <EventEditorForm
            locale={locale}
            redirectTo={`${basePath}?tab=${activeTab}`}
            gameId={game.id}
            seasonId={game.seasonId}
            squadId={game.squadId}
            roster={roster}
            battingRoster={lineupRoster}
            event={editingEvent ?? duplicateEvent}
            duplicate={Boolean(duplicateEvent && !editingEvent)}
          />
        </AdminModal>
      ) : null}
    </AdminShell>
  );
}
