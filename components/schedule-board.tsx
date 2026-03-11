"use client";

import { useMemo, useState } from "react";

import { GameCard } from "@/components/game-card";
import type { Game, Locale } from "@/lib/types";

type Props = {
  locale: Locale;
  games: Game[];
  labels: {
    all: string;
    upcoming: string;
    final: string;
  };
};

export function ScheduleBoard({ locale, games, labels }: Props) {
  const [filter, setFilter] = useState<"all" | "scheduled" | "final">("all");
  const filtered = useMemo(() => {
    if (filter === "all") {
      return games;
    }
    return games.filter((game) => game.status === filter);
  }, [filter, games]);

  const options = [
    { value: "all", label: labels.all },
    { value: "scheduled", label: labels.upcoming },
    { value: "final", label: labels.final }
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${
              filter === option.value
                ? "bg-gold text-ink"
                : "border border-white/10 bg-white/5 text-white/65"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {filtered.map((game) => (
          <GameCard key={game.id} locale={locale} game={game} />
        ))}
      </div>
    </div>
  );
}
