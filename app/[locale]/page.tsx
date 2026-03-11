import Link from "next/link";
import { ArrowRight, CalendarRange, Newspaper, Trophy } from "lucide-react";

import { GalleryCard } from "@/components/gallery-card";
import { GameCard } from "@/components/game-card";
import { PlayerCard } from "@/components/player-card";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";
import { getHomePayload, localizeText } from "@/lib/content";
import { formatDate, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const {
    settings,
    dictionary,
    activeSeason,
    teamStats,
    nextGame,
    latestResult,
    featuredPlayers,
    featuredPosts,
    featuredGalleries
  } = await getHomePayload(locale);

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid bg-[size:44px_44px] opacity-[0.07]" />
        <div className="page-shell grid min-h-[78vh] items-end gap-10 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="min-w-0 space-y-8 text-center lg:text-left">
            <p className="eyebrow">{dictionary.common.season} {activeSeason.label}</p>
            <div className="mx-auto max-w-5xl lg:mx-0">
              <h1 className="mx-auto max-w-[9ch] font-[var(--font-display)] text-[clamp(3.2rem,9vw,7.2rem)] uppercase leading-[0.9] tracking-[0.02em] text-white lg:mx-0">
                <span className="block">Comunica</span>
                <span className="block">ciones</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70 lg:max-w-2xl">
                {localizeText(locale, settings.tagline)}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                href={`/${locale}/roster`}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-ink"
              >
                {dictionary.home.viewRoster}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/games`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white/75"
              >
                {dictionary.home.viewCalendar}
              </Link>
            </div>
            <div className="grid gap-4 text-left sm:grid-cols-3">
              <StatCard label="Record" value={`${teamStats.wins}-${teamStats.losses}`} accent />
              <StatCard label="Runs" value={`${teamStats.runsScored}`} />
              <StatCard label="Streak" value={teamStats.streak} />
            </div>
          </div>
          <div className="panel-dark min-w-0 overflow-hidden p-5">
            <div
              className="min-h-[440px] rounded-[1.6rem] bg-cover bg-center"
              style={{ backgroundImage: `url(${settings.heroImage})` }}
            >
              <div className="flex min-h-[440px] flex-col justify-between bg-gradient-to-t from-black via-black/30 to-transparent p-6">
                <div className="flex justify-between gap-4">
                  <div className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs uppercase tracking-[0.28em] text-gold">
                    {dictionary.home.nextGame}
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/60">
                    {formatDate(nextGame.startsAt, locale)}
                  </div>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/50">{nextGame.venue}</p>
                  <h2 className="mt-3 font-[var(--font-display)] text-6xl uppercase leading-none tracking-[0.08em] text-white">
                    {nextGame.opponent}
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-7 text-white/70">
                    {localizeText(locale, nextGame.summary)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <div className="flex items-center gap-3">
            <CalendarRange className="h-5 w-5 text-gold" />
            <p className="eyebrow">{dictionary.home.nextGame}</p>
          </div>
          <h3 className="mt-4 font-[var(--font-display)] text-5xl uppercase tracking-[0.08em] text-white">
            {nextGame.opponent}
          </h3>
          <p className="mt-2 text-white/65">{formatDate(nextGame.startsAt, locale)} • {nextGame.venue}</p>
          <p className="mt-4 text-sm leading-6 text-white/65">{localizeText(locale, nextGame.summary)}</p>
        </div>
        <div className="panel p-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-gold" />
            <p className="eyebrow">{dictionary.home.latestResult}</p>
          </div>
          <h3 className="mt-4 font-[var(--font-display)] text-5xl uppercase tracking-[0.08em] text-white">
            {latestResult.homeScore} - {latestResult.awayScore}
          </h3>
          <p className="mt-2 text-white/65">{latestResult.opponent}</p>
          <p className="mt-4 text-sm leading-6 text-white/65">{localizeText(locale, latestResult.summary)}</p>
        </div>
      </section>

      <section className="page-shell space-y-8">
        <SectionHeading
          eyebrow={dictionary.home.featuredPlayers}
          title={dictionary.home.featuredPlayers}
          body={localizeText(locale, settings.mission)}
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {featuredPlayers.map((player) => (
            <PlayerCard key={player.id} locale={locale} player={player} />
          ))}
        </div>
      </section>

      <section className="page-shell space-y-8">
        <SectionHeading
          eyebrow={dictionary.home.latestStories}
          title={dictionary.home.latestStories}
          body="Recaps, announcements and editorial pieces built for matchday rhythm."
        />
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            {featuredPosts.slice(0, 2).map((post) => (
              <PostCard key={post.id} locale={locale} post={post} />
            ))}
          </div>
          <div className="panel-dark p-6">
            <div className="flex items-center gap-3">
              <Newspaper className="h-5 w-5 text-gold" />
              <p className="eyebrow">{dictionary.home.readFeed}</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/68">
              Editorial space for game summaries, club notices, roster news and image-driven updates.
            </p>
            <Link
              href={`/${locale}/feed`}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold"
            >
              {dictionary.home.readFeed}
            </Link>
          </div>
        </div>
      </section>

      <section className="page-shell space-y-8">
        <SectionHeading
          eyebrow={dictionary.home.photoMoments}
          title={dictionary.home.photoMoments}
          body="Simple but striking photo galleries for games, training and team identity."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {featuredGalleries.map((gallery) => (
            <GalleryCard key={gallery.id} locale={locale} gallery={gallery} />
          ))}
        </div>
      </section>

      <section className="page-shell">
        <GameCard locale={locale} game={nextGame} />
      </section>
    </main>
  );
}
