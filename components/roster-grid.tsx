"use client";

import { useMemo, useState } from "react";

import { PlayerCard } from "@/components/player-card";
import type { Locale, Player } from "@/lib/types";

type Props = {
  locale: Locale;
  players: Player[];
  searchLabel: string;
  filterLabel: string;
  allPositionsLabel: string;
  emptyLabel?: string;
};

export function RosterGrid({
  locale,
  players,
  searchLabel,
  filterLabel,
  allPositionsLabel,
  emptyLabel = "No hay jugadores publicados en este roster todavia."
}: Props) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("all");
  const positions = useMemo(
    () => ["all", ...new Set(players.map((player) => player.assignment.position))],
    [players]
  );

  const filtered = useMemo(() => {
    return players.filter((player) => {
      const matchesQuery = `${player.firstName} ${player.lastName}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesPosition = position === "all" || player.assignment.position === position;
      return matchesQuery && matchesPosition;
    });
  }, [players, position, query]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-[1.5fr_280px]">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.28em] text-white/45">{searchLabel}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Mateo Cabrera"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-0 placeholder:text-white/30 focus:border-gold/40"
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.28em] text-white/45">{filterLabel}</span>
          <select
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-gold/40"
          >
            {positions.map((item) => (
              <option key={item} value={item} className="bg-ink">
                {item === "all" ? allPositionsLabel : item}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((player) => (
            <PlayerCard key={`${player.id}-${player.assignment.squadId}`} locale={locale} player={player} />
          ))}
        </div>
      ) : (
        <div className="panel p-6 text-sm text-white/65">{emptyLabel}</div>
      )}
    </div>
  );
}
