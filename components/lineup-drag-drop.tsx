"use client";

import { useMemo, useState } from "react";
import { GripVertical, Search, X } from "lucide-react";
import type { GameLineupEntry, Player } from "@/lib/types";

const POSITIONS = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"] as const;
type Slot = { playerId: string; defensivePosition: string };

export function LineupDragDrop({ locale, redirectTo, gameId, roster, lineup, previousLineups, action }: {
  locale: string; redirectTo: string; gameId: string; roster: Player[]; lineup: GameLineupEntry[];
  previousLineups: Array<{ gameId: string; opponent: string; startsAt: string; seasonLabel: string; entries: GameLineupEntry[] }>;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState("");
  const [slots, setSlots] = useState<Slot[]>(() => Array.from({ length: 9 }, (_, index) => {
    const entry = lineup.find((item) => item.battingOrder === index + 1);
    return { playerId: entry?.playerId ?? "", defensivePosition: entry?.defensivePosition ?? "DH" };
  }));
  const playersById = useMemo(() => new Map(roster.map((player) => [player.id, player])), [roster]);
  const assigned = new Set(slots.map((slot) => slot.playerId).filter(Boolean));
  const available = roster.filter((player) => {
    const label = `${player.firstName} ${player.lastName} ${player.assignment.jerseyNumber}`.toLowerCase();
    return !assigned.has(player.id) && label.includes(query.toLowerCase().trim());
  });

  function placePlayer(playerId: string, targetIndex: number) {
    setSlots((current) => {
      const next = current.map((slot) => ({ ...slot }));
      const sourceIndex = next.findIndex((slot) => slot.playerId === playerId);
      if (sourceIndex === targetIndex) return next;
      if (sourceIndex >= 0) {
        const displaced = next[targetIndex];
        next[targetIndex] = next[sourceIndex];
        next[sourceIndex] = displaced;
      } else next[targetIndex] = { ...next[targetIndex], playerId };
      return next;
    });
    setDraggedPlayerId(null);
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="locale" value={locale} /><input type="hidden" name="redirectTo" value={redirectTo} /><input type="hidden" name="gameId" value={gameId} />
      <div className="rounded-xl border border-gold/20 bg-gold/5 p-3">
        <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">Copiar lineup anterior</label>
        <select
          defaultValue=""
          disabled={!previousLineups.length}
          onChange={(event) => {
            const source = previousLineups.find((item) => item.gameId === event.target.value);
            if (!source) return;
            const validEntries = source.entries.filter((entry) => playersById.has(entry.playerId)).slice(0, 9);
            setSlots(Array.from({ length: 9 }, (_, index) => {
              const entry = validEntries.find((item) => item.battingOrder === index + 1);
              return { playerId: entry?.playerId ?? "", defensivePosition: entry?.defensivePosition ?? "DH" };
            }));
            const omitted = source.entries.length - validEntries.length;
            setCopyNotice(omitted ? `Lineup copiado. ${omitted} jugador${omitted === 1 ? "" : "es"} no está habilitado en esta liga/temporada.` : "Lineup copiado. Puedes ajustarlo antes de guardar.");
          }}
          className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-ink px-3 text-sm text-white outline-none disabled:opacity-50"
        >
          <option value="">{previousLineups.length ? "Seleccionar un juego…" : "No hay lineups anteriores"}</option>
          {previousLineups.map((source) => <option key={source.gameId} value={source.gameId}>{source.seasonLabel} · {new Date(source.startsAt).toLocaleDateString(locale)} · vs {source.opponent}</option>)}
        </select>
        {copyNotice ? <p className="mt-2 text-xs text-white/55">{copyNotice}</p> : null}
      </div>
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Jugadores disponibles</p>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 focus-within:border-gold/50">
          <Search className="h-4 w-4 text-white/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jugador" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
        </label>
        <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1">
          {available.map((player) => <button key={player.id} type="button" draggable onDragStart={(event) => { event.dataTransfer.setData("text/player-id", player.id); setDraggedPlayerId(player.id); }} onDragEnd={() => setDraggedPlayerId(null)} className="flex w-full cursor-grab items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left active:cursor-grabbing">
            <GripVertical className="h-4 w-4 shrink-0 text-gold/70" /><span className="min-w-0 flex-1 truncate text-sm text-white">#{player.assignment.jerseyNumber} {player.firstName} {player.lastName}</span><span className="text-[10px] font-semibold uppercase text-white/35">{player.assignment.squadId}</span>
          </button>)}
          {!available.length ? <p className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs text-white/40">No hay jugadores disponibles.</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        {slots.map((slot, index) => { const player = playersById.get(slot.playerId); return <div key={index} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/player-id") || draggedPlayerId; if (id) placePlayer(id, index); }} className={`grid min-h-16 grid-cols-[38px_minmax(0,1fr)_72px_32px] items-center gap-2 rounded-xl border p-2 transition ${draggedPlayerId ? "border-dashed border-gold/35 bg-gold/5" : "border-white/10 bg-black/25"}`}>
          <span className="text-center text-sm font-semibold text-gold">{index + 1}</span>
          <div draggable={Boolean(player)} onDragStart={(event) => { if (!player) return; event.dataTransfer.setData("text/player-id", player.id); setDraggedPlayerId(player.id); }} onDragEnd={() => setDraggedPlayerId(null)} className={player ? "flex min-w-0 cursor-grab items-center gap-2" : "text-xs text-white/30"}>{player ? <><GripVertical className="h-4 w-4 shrink-0 text-white/30" /><span className="truncate text-sm text-white">#{player.assignment.jerseyNumber} {player.firstName} {player.lastName}</span></> : "Arrastra aquí"}</div>
          <select value={slot.defensivePosition} onChange={(event) => setSlots((current) => current.map((item, i) => i === index ? { ...item, defensivePosition: event.target.value } : item))} className="h-10 rounded-lg border border-white/10 bg-ink px-2 text-xs text-white outline-none">{POSITIONS.map((position) => <option key={position}>{position}</option>)}</select>
          <button type="button" disabled={!player} onClick={() => setSlots((current) => current.map((item, i) => i === index ? { ...item, playerId: "" } : item))} aria-label={`Quitar jugador del turno ${index + 1}`} className="flex h-8 w-8 items-center justify-center rounded-full text-white/35 hover:bg-white/10 hover:text-white disabled:invisible"><X className="h-4 w-4" /></button>
          <input type="hidden" name={`lineupPlayer_${index + 1}`} value={slot.playerId} /><input type="hidden" name={`lineupPosition_${index + 1}`} value={slot.defensivePosition} />
        </div>; })}
      </div>
      <button type="submit" className="w-full rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink">Guardar lineup</button>
    </form>
  );
}
