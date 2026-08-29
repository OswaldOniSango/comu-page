"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Search, X } from "lucide-react";

import type { GameLineupEntry, Player } from "@/lib/types";

const FIELD_POSITIONS = ["LF", "CF", "RF", "SS", "2B", "3B", "P", "1B", "C"] as const;
const ALL_POSITIONS = [...FIELD_POSITIONS, "DH"] as const;
type Position = (typeof ALL_POSITIONS)[number];
type FieldState = Record<Position, string>;

const fieldPlacement: Record<(typeof FIELD_POSITIONS)[number], string> = {
  LF: "col-start-1 row-start-1", CF: "col-start-2 row-start-1", RF: "col-start-3 row-start-1",
  SS: "col-start-1 row-start-2", "2B": "col-start-3 row-start-2",
  "3B": "col-start-1 row-start-3", P: "col-start-2 row-start-3", "1B": "col-start-3 row-start-3",
  C: "col-start-2 row-start-4"
};

export function LineupFieldBuilder({ locale, redirectTo, gameId, roster, lineup, previousLineups, action }: {
  locale: string;
  redirectTo: string;
  gameId: string;
  roster: Player[];
  lineup: GameLineupEntry[];
  previousLineups: Array<{ gameId: string; opponent: string; startsAt: string; seasonLabel: string; entries: GameLineupEntry[] }>;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const playersById = useMemo(() => new Map(roster.map((player) => [player.id, player])), [roster]);
  const buildField = (entries: GameLineupEntry[]) => {
    const next = Object.fromEntries(ALL_POSITIONS.map((position) => [position, ""])) as FieldState;
    entries.forEach((entry) => {
      const position = ALL_POSITIONS.includes(entry.defensivePosition as Position) ? entry.defensivePosition as Position : "DH";
      if (!next[position] && playersById.has(entry.playerId)) next[position] = entry.playerId;
    });
    return next;
  };
  const [field, setField] = useState<FieldState>(() => buildField(lineup));
  const [battingOrder, setBattingOrder] = useState<string[]>(() => lineup.sort((a, b) => a.battingOrder - b.battingOrder).map((entry) => entry.playerId).filter((id) => playersById.has(id)));
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [draggedPlayerId, setDraggedPlayerId] = useState("");
  const [query, setQuery] = useState("");
  const [copyNotice, setCopyNotice] = useState("");

  const assignedIds = new Set(Object.values(field).filter(Boolean));
  const available = roster.filter((player) => !assignedIds.has(player.id) && `${player.firstName} ${player.lastName} ${player.assignment.jerseyNumber}`.toLowerCase().includes(query.trim().toLowerCase()));

  function assignPlayer(playerId: string, position: Position) {
    if (!playerId) return;
    setField((current) => {
      const next = { ...current };
      const oldPosition = ALL_POSITIONS.find((key) => next[key] === playerId);
      const displaced = next[position];
      if (oldPosition) next[oldPosition] = displaced || "";
      next[position] = playerId;
      return next;
    });
    setBattingOrder((current) => current.includes(playerId) ? current : [...current, playerId].slice(0, 10));
    setSelectedPlayerId("");
    setDraggedPlayerId("");
  }

  function removePlayer(position: Position) {
    const playerId = field[position];
    setField((current) => ({ ...current, [position]: "" }));
    setBattingOrder((current) => current.filter((id) => id !== playerId));
  }

  function moveBatter(index: number, direction: -1 | 1) {
    setBattingOrder((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function playerName(playerId: string) {
    const player = playersById.get(playerId);
    return player ? `${player.firstName} ${player.lastName}` : "Jugador";
  }

  function PositionSlot({ position, className = "" }: { position: Position; className?: string }) {
    const playerId = field[position];
    return <div
      onClick={() => selectedPlayerId && assignPlayer(selectedPlayerId, position)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); assignPlayer(event.dataTransfer.getData("text/player-id") || draggedPlayerId, position); }}
      className={`${className} relative flex min-h-[66px] items-center justify-center rounded-2xl border-2 border-dashed p-2 text-center transition ${selectedPlayerId ? "border-gold/70 bg-gold/15" : playerId ? "border-gold/70 bg-gold/20" : "border-white/25 bg-ink/90"}`}
    >
      {playerId ? <div draggable onDragStart={(event) => { event.dataTransfer.setData("text/player-id", playerId); setDraggedPlayerId(playerId); }} className="w-full cursor-grab pr-5">
        <p className="truncate text-xs font-bold text-white sm:text-sm">{playerName(playerId)}</p><p className="mt-1 text-[10px] font-semibold text-gold">{position}</p>
        <button type="button" onClick={(event) => { event.stopPropagation(); removePlayer(position); }} aria-label={`Quitar ${playerName(playerId)}`} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"><X className="h-3 w-3" /></button>
      </div> : <span className="text-sm font-bold text-white/55">{position}</span>}
    </div>;
  }

  return <form action={action} className="space-y-6">
    <input type="hidden" name="locale" value={locale} /><input type="hidden" name="redirectTo" value={redirectTo} /><input type="hidden" name="gameId" value={gameId} />

    <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
      <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">Copiar lineup anterior</label>
      <select defaultValue="" disabled={!previousLineups.length} onChange={(event) => {
        const source = previousLineups.find((item) => item.gameId === event.target.value);
        if (!source) return;
        const valid = source.entries.filter((entry) => playersById.has(entry.playerId)).slice(0, 10);
        setField(buildField(valid)); setBattingOrder(valid.sort((a, b) => a.battingOrder - b.battingOrder).map((entry) => entry.playerId));
        const omitted = source.entries.length - valid.length;
        setCopyNotice(omitted ? `Se omitieron ${omitted} jugadores no habilitados para este juego.` : "Lineup copiado. Puedes cambiar campo y orden antes de guardar.");
      }} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-ink px-3 text-sm text-white outline-none disabled:opacity-50">
        <option value="">{previousLineups.length ? "Seleccionar un juego…" : "No hay lineups anteriores"}</option>
        {previousLineups.map((source) => <option key={source.gameId} value={source.gameId}>{source.seasonLabel} · {new Date(source.startsAt).toLocaleDateString(locale)} · vs {source.opponent}</option>)}
      </select>
      {copyNotice && <p className="mt-2 text-xs text-white/55">{copyNotice}</p>}
    </div>

    <section>
      <div className="mb-3"><h3 className="text-center font-[var(--font-display)] text-2xl uppercase text-gold">Posiciones en el campo</h3><p className="mt-1 text-center text-xs text-white/45">Arrastra un jugador o tócalo y luego toca su posición.</p></div>
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-white/20 bg-gradient-to-b from-emerald-800 to-emerald-950 p-3 sm:p-5">
        <div className="pointer-events-none absolute left-1/2 top-[43%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rotate-45 border-[28px] border-amber-500/60 sm:h-64 sm:w-64" />
        <div className="relative grid grid-cols-3 grid-rows-4 gap-3 sm:gap-5">{FIELD_POSITIONS.map((position) => <PositionSlot key={position} position={position} className={fieldPlacement[position]} />)}</div>
        <div className="relative mx-auto mt-3 max-w-[220px]"><PositionSlot position="DH" /></div>
      </div>
    </section>

    <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-center font-[var(--font-display)] text-2xl uppercase text-gold">Banca / disponibles</h3>
      <label className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3"><Search className="h-4 w-4 text-white/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jugador…" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" /></label>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{available.map((player) => <button key={player.id} type="button" draggable onClick={() => setSelectedPlayerId((current) => current === player.id ? "" : player.id)} onDragStart={(event) => { event.dataTransfer.setData("text/player-id", player.id); setDraggedPlayerId(player.id); }} className={`flex min-w-0 cursor-grab items-center gap-2 rounded-xl border px-3 py-3 text-left ${selectedPlayerId === player.id ? "border-gold bg-gold text-ink" : "border-white/10 bg-slate-200 text-ink"}`}><GripVertical className="h-4 w-4 shrink-0" /><span className="truncate text-sm font-bold">#{player.assignment.jerseyNumber} {player.firstName} {player.lastName}</span></button>)}</div>
    </section>

    <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-center font-[var(--font-display)] text-2xl uppercase text-gold">Orden al bate</h3>
      <div className="mt-4 space-y-2">{Array.from({ length: 10 }, (_, index) => {
        const playerId = battingOrder[index]; const position = ALL_POSITIONS.find((key) => field[key] === playerId);
        return <div key={index} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/player-id"); if (!id || !battingOrder.includes(id)) return; setBattingOrder((current) => { const next = current.filter((item) => item !== id); next.splice(index, 0, id); return next; }); }} className="grid min-h-14 grid-cols-[42px_minmax(0,1fr)_38px_38px] items-center gap-2 rounded-xl border border-white/10 bg-ink/80 p-2">
          <span className="text-center font-bold text-gold">{index + 1}°</span><div draggable={Boolean(playerId)} onDragStart={(event) => playerId && event.dataTransfer.setData("text/player-id", playerId)} className={`truncate rounded-lg px-3 py-2 text-center text-sm font-bold ${playerId ? "cursor-grab bg-gold text-ink" : "text-white/20"}`}>{playerId ? `${playerName(playerId)} (${position})` : "Sin asignar"}</div>
          <button type="button" disabled={!playerId || index === 0} onClick={() => moveBatter(index, -1)} className="flex h-9 items-center justify-center rounded-lg bg-white/10 text-gold disabled:opacity-20"><ArrowUp className="h-4 w-4" /></button><button type="button" disabled={!playerId || index === battingOrder.length - 1} onClick={() => moveBatter(index, 1)} className="flex h-9 items-center justify-center rounded-lg bg-white/10 text-gold disabled:opacity-20"><ArrowDown className="h-4 w-4" /></button>
          <input type="hidden" name={`lineupPlayer_${index + 1}`} value={playerId ?? ""} /><input type="hidden" name={`lineupPosition_${index + 1}`} value={position ?? "DH"} />
        </div>;
      })}</div>
    </section>
    <button type="submit" className="w-full rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink">Guardar lineup</button>
  </form>;
}
