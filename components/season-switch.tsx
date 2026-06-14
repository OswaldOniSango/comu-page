import Link from "next/link";

import type { Season } from "@/lib/types";

type Props = {
  basePath: string;
  seasons: Season[];
  selectedSeasonId: string;
  extraParams?: Record<string, string | undefined>;
};

export function SeasonSwitch({ basePath, seasons, selectedSeasonId, extraParams }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {seasons.map((season) => {
        const params = new URLSearchParams();
        params.set("season", season.id);

        if (extraParams) {
          Object.entries(extraParams).forEach(([key, value]) => {
            if (value) {
              params.set(key, value);
            }
          });
        }

        return (
          <Link
            key={season.id}
            href={`${basePath}?${params.toString()}`}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${
              season.id === selectedSeasonId
                ? "bg-gold text-ink"
                : "border border-white/10 bg-white/5 text-white/70"
            }`}
          >
            {season.label}
          </Link>
        );
      })}
    </div>
  );
}
