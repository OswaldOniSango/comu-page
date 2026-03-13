import Image from "next/image";
import Link from "next/link";

import { localizeText } from "@/lib/content";
import type { Locale, Player } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type Props = {
  locale: Locale;
  player: Player;
};

export function PlayerCard({ locale, player }: Props) {
  return (
    <Link
      href={`/${locale}/roster/${player.slug}?squad=${player.assignment.squadId}`}
      className="group panel-dark overflow-hidden hover:-translate-y-1"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={player.photo}
          alt={`${player.firstName} ${player.lastName}`}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 font-[var(--font-display)] text-2xl uppercase text-ink">
          #{player.assignment.jerseyNumber}
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">
            {player.assignment.squadId.toUpperCase()} • {player.assignment.position}
          </p>
          <h3 className="font-[var(--font-display)] text-4xl uppercase tracking-[0.08em] text-white">
            {player.firstName} {player.lastName}
          </h3>
        </div>
        <p className="text-sm leading-6 text-white/65">{localizeText(locale, player.bio)}</p>
        <div className="grid grid-cols-4 gap-3 border-t border-white/10 pt-4 text-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">G</p>
            <p className="mt-1 font-semibold text-white">{player.stats.gamesPlayed}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">
              {player.role === "pitcher" ? "ERA" : "AVG"}
            </p>
            <p className="mt-1 font-semibold text-white">
              {player.role === "pitcher"
                ? formatNumber(player.stats.era, 2)
                : formatNumber(player.stats.avg, 3)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">
              {player.role === "pitcher" ? "SO" : "OPS"}
            </p>
            <p className="mt-1 font-semibold text-white">
              {player.role === "pitcher"
                ? formatNumber(player.stats.strikeouts)
                : formatNumber(player.stats.ops, 3)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/45">
              {player.role === "pitcher" ? "W" : "RBI"}
            </p>
            <p className="mt-1 font-semibold text-white">
              {player.role === "pitcher"
                ? formatNumber(player.stats.wins)
                : formatNumber(player.stats.runsBattedIn)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
