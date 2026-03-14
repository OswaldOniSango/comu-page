import Link from "next/link";

import { localizeText } from "@/lib/content";
import { formatDate } from "@/lib/i18n";
import type { Game, Locale } from "@/lib/types";

type Props = {
  locale: Locale;
  game: Game;
};

export function GameCard({ locale, game }: Props) {
  const isFinal = game.status === "final";
  const score = isFinal
    ? game.isHome
      ? `${game.homeScore} - ${game.awayScore}`
      : `${game.awayScore} - ${game.homeScore}`
    : formatDate(game.startsAt, locale);

  return (
    <Link
      href={`/${locale}/games/${game.slug}?squad=${game.squadId}`}
      className="panel group flex flex-col justify-between gap-6 p-6 hover:border-gold/30"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">
            {game.squadId.toUpperCase()} • {game.isHome ? "HOME" : "AWAY"}
          </p>
          <p className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-gold">
            {game.status}
          </p>
        </div>
        <h3 className="mt-4 font-[var(--font-display)] text-3xl uppercase tracking-[0.06em] text-white sm:text-4xl sm:tracking-[0.08em]">
          {game.opponent}
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/65">{localizeText(locale, game.summary)}</p>
      </div>
      <div className="flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">{game.venue}</p>
          <p className="mt-2 font-[var(--font-display)] text-2xl uppercase tracking-[0.06em] text-gold sm:text-3xl sm:tracking-[0.08em]">
            {score}
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60 group-hover:text-gold">
          View game
        </span>
      </div>
    </Link>
  );
}
