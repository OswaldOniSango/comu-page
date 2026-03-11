import Image from "next/image";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { getPlayerBySlug, localizeText } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { formatNumber } from "@/lib/utils";

export default async function PlayerPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const player = await getPlayerBySlug(slug);
  if (!player) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const isPitcher = player.role === "pitcher";

  return (
    <main className="page-shell space-y-10">
      <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="panel-dark relative aspect-[4/5] overflow-hidden">
          <Image
            src={player.photo}
            alt={`${player.firstName} ${player.lastName}`}
            fill
            className="object-cover"
          />
        </div>
        <div className="space-y-6">
          <p className="eyebrow">{player.position} • #{player.jerseyNumber}</p>
          <h1 className="font-[var(--font-display)] text-7xl uppercase leading-none tracking-[0.08em] text-white">
            {player.firstName} {player.lastName}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-white/70">{localizeText(locale, player.bio)}</p>
          {player.spotlightQuote ? (
            <blockquote className="panel border-gold/20 p-5 text-white/80">
              “{localizeText(locale, player.spotlightQuote)}”
            </blockquote>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">B/T</p>
              <p className="mt-3 font-[var(--font-display)] text-4xl uppercase tracking-[0.08em] text-white">
                {player.bats}/{player.throws}
              </p>
            </div>
            <div className="panel p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Hometown</p>
              <p className="mt-3 font-[var(--font-display)] text-4xl uppercase tracking-[0.08em] text-white">
                {player.hometown}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow={dictionary.home.teamStats}
          title={isPitcher ? "Pitching line" : "Offensive line"}
        />
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="panel p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">G</p>
            <p className="mt-3 font-[var(--font-display)] text-5xl text-white">{player.stats.gamesPlayed}</p>
          </div>
          {isPitcher ? (
            <>
              <div className="panel p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">W-L</p>
                <p className="mt-3 font-[var(--font-display)] text-5xl text-white">
                  {formatNumber(player.stats.wins)}-{formatNumber(player.stats.losses)}
                </p>
              </div>
              <div className="panel p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">ERA</p>
                <p className="mt-3 font-[var(--font-display)] text-5xl text-white">
                  {formatNumber(player.stats.era, 2)}
                </p>
              </div>
              <div className="panel p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">WHIP</p>
                <p className="mt-3 font-[var(--font-display)] text-5xl text-white">
                  {formatNumber(player.stats.whip, 2)}
                </p>
              </div>
              <div className="panel p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">SO</p>
                <p className="mt-3 font-[var(--font-display)] text-5xl text-white">
                  {formatNumber(player.stats.strikeouts)}
                </p>
              </div>
              <div className="panel p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">SV</p>
                <p className="mt-3 font-[var(--font-display)] text-5xl text-white">
                  {formatNumber(player.stats.saves)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="panel p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">AVG</p>
                <p className="mt-3 font-[var(--font-display)] text-5xl text-white">
                  {formatNumber(player.stats.avg, 3)}
                </p>
              </div>
              <div className="panel p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">OBP</p>
                <p className="mt-3 font-[var(--font-display)] text-5xl text-white">
                  {formatNumber(player.stats.obp, 3)}
                </p>
              </div>
              <div className="panel p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">SLG</p>
                <p className="mt-3 font-[var(--font-display)] text-5xl text-white">
                  {formatNumber(player.stats.slg, 3)}
                </p>
              </div>
              <div className="panel p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">OPS</p>
                <p className="mt-3 font-[var(--font-display)] text-5xl text-white">
                  {formatNumber(player.stats.ops, 3)}
                </p>
              </div>
              <div className="panel p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">RBI</p>
                <p className="mt-3 font-[var(--font-display)] text-5xl text-white">
                  {formatNumber(player.stats.runsBattedIn)}
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
