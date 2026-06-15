"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

import type { Season, Squad } from "@/lib/types";

type Props = {
  basePath: string;
  seasons: Season[];
  squads: Squad[];
  selectedSeasonId: string;
  selectedSquadId: string;
  seasonLabel: string;
  squadLabel: string;
};

export function PublicFilters({
  basePath,
  seasons,
  squads,
  selectedSeasonId,
  selectedSquadId,
  seasonLabel,
  squadLabel
}: Props) {
  const router = useRouter();

  const activeSquads = squads
    .filter((squad) => squad.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  function navigate(nextSeasonId: string, nextSquadId: string) {
    const params = new URLSearchParams({
      season: nextSeasonId,
      squad: nextSquadId
    });

    startTransition(() => {
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="panel max-w-3xl p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-left">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
            {seasonLabel}
          </span>
          <select
            value={selectedSeasonId}
            onChange={(event) => navigate(event.target.value, selectedSquadId)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-gold"
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id} className="bg-ink">
                {season.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-left">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
            {squadLabel}
          </span>
          <select
            value={selectedSquadId}
            onChange={(event) => navigate(selectedSeasonId, event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-gold"
          >
            {activeSquads.map((squad) => (
              <option key={squad.id} value={squad.id} className="bg-ink">
                {squad.code}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
