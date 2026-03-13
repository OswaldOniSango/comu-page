import Link from "next/link";

import type { Squad, SquadId } from "@/lib/types";

type Props = {
  basePath: string;
  squads: Squad[];
  selectedSquadId: SquadId;
  extraParams?: Record<string, string | undefined>;
};

export function SquadSwitch({ basePath, squads, selectedSquadId, extraParams }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {squads
        .filter((squad) => squad.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((squad) => {
          const params = new URLSearchParams();
          params.set("squad", squad.id);

          if (extraParams) {
            Object.entries(extraParams).forEach(([key, value]) => {
              if (value) {
                params.set(key, value);
              }
            });
          }

          return (
            <Link
              key={squad.id}
              href={`${basePath}?${params.toString()}`}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${
                squad.id === selectedSquadId
                  ? "bg-gold text-ink"
                  : "border border-white/10 bg-white/5 text-white/70"
              }`}
            >
              {squad.code}
            </Link>
          );
        })}
    </div>
  );
}
