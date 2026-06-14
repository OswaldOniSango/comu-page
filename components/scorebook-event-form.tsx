"use client";

import { useState } from "react";

import { deleteGameBattingEventAction, saveGameBattingEventAction } from "@/lib/admin-actions";
import {
  getDefaultDestinationForEvent,
  requiresFieldersForEvent,
  SCOREBOOK_EVENT_OPTIONS
} from "@/lib/scorebook";
import type { BaseDestination, GameBattingEvent, Player, ScorebookEventCode } from "@/lib/types";

const QUICK_EVENT_CODES: ScorebookEventCode[] = [
  "single",
  "double",
  "triple",
  "home_run",
  "bb",
  "k",
  "k_looking",
  "go",
  "fc",
  "e",
  "dp"
];

const ADVANCE_OPTIONS: Array<{ value: BaseDestination; label: string }> = [
  { value: "1", label: "1B" },
  { value: "2", label: "2B" },
  { value: "3", label: "3B" },
  { value: "H", label: "Home" },
  { value: "O", label: "Out" }
];

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

type Props = {
  locale: string;
  redirectTo: string;
  errorRedirectTo: string;
  gameId: string;
  seasonId: string;
  squadId: string;
  roster: Player[];
  battingRoster: Player[];
  initialPlayerId?: string;
  initialInningNumber?: number;
  event?: GameBattingEvent;
  duplicate?: boolean;
  errorCode?: string;
};

export function ScorebookEventForm({
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
}: Props) {
  const [selectedEventCode, setSelectedEventCode] = useState<ScorebookEventCode>(
    event?.eventCode ?? "single"
  );
  const defaultAdvance = getDefaultDestinationForEvent(selectedEventCode);
  const routeValue = event?.fielderPath ?? event?.hitZone ?? "";
  const requiresFielders = requiresFieldersForEvent(selectedEventCode);
  const quickOptions = QUICK_EVENT_CODES.map((value) =>
    SCOREBOOK_EVENT_OPTIONS.find((option) => option.value === value)
  ).filter((option): option is NonNullable<(typeof SCOREBOOK_EVENT_OPTIONS)[number]> => Boolean(option));

  return (
    <form action={saveGameBattingEventAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="errorRedirectTo" value={errorRedirectTo} />
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="seasonId" value={seasonId} />
      <input type="hidden" name="squadId" value={squadId} />
      <input type="hidden" name="id" value={duplicate ? "" : event?.id ?? ""} />
      <input type="hidden" name="defaultAdvanceBatter" value={defaultAdvance} />
      <input type="hidden" name="eventCode" value={selectedEventCode} />

      {errorCode === "missing-fielder-path" ? (
        <div className="rounded-[1.25rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          Esta jugada necesita ruta defensiva. Ejemplos: `63`, `6-4-3`, `FC6`, `E5`.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
        <label className={labelClassName()}>
          Inning
          <input
            name="inningNumber"
            type="number"
            min={1}
            defaultValue={event?.inningNumber ?? initialInningNumber ?? 1}
            className={fieldClassName()}
          />
        </label>
        <label className={labelClassName()}>
          Bateador
          <select
            name="batterPlayerId"
            defaultValue={
              event?.batterPlayerId ?? initialPlayerId ?? battingRoster[0]?.id ?? roster[0]?.id ?? ""
            }
            className={fieldClassName()}
          >
            {battingRoster.map((player) => (
              <option key={player.id} value={player.id} className="bg-ink">
                {getPlayerLabel(player)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className={panelSectionClassName()}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Resultado</h3>
            <p className="mt-1 text-sm text-white/55">
              Anota solo cómo terminó el turno. La notación oficial se genera automáticamente.
            </p>
          </div>
          <div className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            Rápido
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickOptions.map((option) => {
            const isSelected = option.value === selectedEventCode;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedEventCode(option.value)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  isSelected
                    ? "border-gold/40 bg-gold text-ink"
                    : "border-white/10 bg-black/25 text-white/75 hover:border-gold/30 hover:text-gold"
                }`}
              >
                {option.notation || option.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
        <label className={labelClassName()}>
          Tipo detallado
          <select
            value={selectedEventCode}
            onChange={(event) => setSelectedEventCode(event.target.value as ScorebookEventCode)}
            className={fieldClassName()}
          >
            {SCOREBOOK_EVENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-ink">
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName()}>
          {requiresFielders ? "Ruta defensiva *" : "Ruta defensiva"}
          <input
            name="fielderPath"
            defaultValue={routeValue}
            placeholder="7, 8, 9, 63, 6-4-3, FC6, E5"
            required={requiresFielders}
            className={fieldClassName()}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
        <label className={labelClassName()}>
          Carreras Anotadas
          <input
            name="runsScoredCount"
            type="number"
            min={0}
            defaultValue={event?.runsScoredCount ?? 0}
            className={fieldClassName()}
          />
        </label>
        <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/55">
          Si esta jugada produjo carreras, anótalas aquí sin necesidad de detallar todos los corredores.
        </div>
      </div>

      <details className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
        <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
          Ajustes avanzados
        </summary>
        <p className="mt-2 text-sm text-white/50">
          Solo si quieres completar bases, avances, RBI o notas.
        </p>

        <div className="mt-5 space-y-5">
          <section className={panelSectionClassName()}>
            <div>
              <h3 className="text-lg font-semibold text-white">Bases antes de la jugada</h3>
              <p className="mt-1 text-sm text-white/55">
                Contexto opcional para registrar corredores.
              </p>
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
            <div>
              <h3 className="text-lg font-semibold text-white">Avance de corredores</h3>
              <p className="mt-1 text-sm text-white/55">
                Solo si necesitas detallar cómo terminó cada corredor.
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
                    defaultValue={
                      advance.startBase === "B"
                        ? getAdvanceFor(event, advance.startBase) ?? ""
                        : getAdvanceFor(event, advance.startBase) ?? ""
                    }
                    className={fieldClassName()}
                  >
                    <option value="" className="bg-ink">
                      Automático
                    </option>
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
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-gold/20 bg-gold/5 px-4 py-4">
        <p className="text-sm text-white/65">
          Ejemplos: `H7`, `2B8`, `HR`, `63`, `6-4-3`, `FC6`, `E5`.
        </p>
        <div className="flex flex-wrap gap-3">
          {event && !duplicate ? (
            <button
              type="submit"
              formAction={deleteGameBattingEventAction}
              className="rounded-full border border-red-400/30 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-red-200"
            >
              Eliminar jugada
            </button>
          ) : null}
          <button
            type="submit"
            className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
          >
            {event && !duplicate ? "Guardar jugada" : "Agregar jugada"}
          </button>
        </div>
      </div>
    </form>
  );
}
