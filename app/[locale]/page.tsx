import Link from "next/link";
import { ArrowRight, CalendarRange, Newspaper, Trophy } from "lucide-react";

import { GalleryCard } from "@/components/gallery-card";
import { GameCard } from "@/components/game-card";
import { PlayerCard } from "@/components/player-card";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";
import { SquadSwitch } from "@/components/squad-switch";
import { getHomePayload, localizeText } from "@/lib/content";
import { formatDate, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function HomePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ squad?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  const {
    settings,
    dictionary,
    activeSeason,
    squads,
    selectedSquad,
    teamStats,
    nextGame,
    latestResult,
    featuredPlayers,
    featuredPosts,
    featuredGalleries
  } = await getHomePayload(locale, query.squad);

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid bg-[size:44px_44px] opacity-[0.07]" />
        <div className="page-shell grid min-h-[auto] items-end gap-8 py-8 lg:min-h-[78vh] lg:gap-10 lg:py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="min-w-0 space-y-8 text-center lg:text-left">
            <p className="eyebrow">{dictionary.common.season} {activeSeason.label}</p>
            <div className="mx-auto max-w-5xl overflow-hidden lg:mx-0">
              <h1 className="mx-auto max-w-none whitespace-nowrap font-[var(--font-display)] text-[clamp(2.15rem,9.8vw,3.05rem)] uppercase leading-[0.92] tracking-[0.01em] text-white sm:max-w-[8.8ch] sm:text-[clamp(3.3rem,12vw,5.3rem)] sm:tracking-[0.02em] lg:mx-0 lg:max-w-none lg:text-[clamp(3.8rem,5vw,5.05rem)] lg:tracking-[0.005em]">
                Comunicaciones
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 sm:mt-5 sm:text-lg sm:leading-8 lg:max-w-2xl">
                {localizeText(locale, settings.tagline)}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                href={`/${locale}/roster?squad=${selectedSquad.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-ink"
              >
                {dictionary.home.viewRoster}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/games?squad=${selectedSquad.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white/75"
              >
                {dictionary.home.viewCalendar}
              </Link>
            </div>
            <SquadSwitch
              basePath={`/${locale}`}
              squads={squads}
              selectedSquadId={selectedSquad.id}
            />
            <div className="grid gap-4 text-left sm:grid-cols-3">
              <StatCard label="Record" value={`${teamStats.wins}-${teamStats.losses}`} accent />
              <StatCard label="Runs" value={`${teamStats.runsScored}`} />
              <StatCard label="Streak" value={teamStats.streak} />
            </div>
          </div>
          <div className="panel-dark min-w-0 overflow-hidden p-5">
            <div
              className="min-h-[360px] rounded-[1.6rem] bg-cover bg-center sm:min-h-[420px] lg:min-h-[440px]"
              style={{ backgroundImage: `url(${settings.heroImage})` }}
            >
              <div className="flex min-h-[360px] flex-col justify-between bg-gradient-to-t from-black via-black/30 to-transparent p-5 sm:min-h-[420px] sm:p-6 lg:min-h-[440px]">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4">
                  <div className="w-fit rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs uppercase tracking-[0.28em] text-gold">
                    {dictionary.home.nextGame}
                  </div>
                  {nextGame ? (
                    <div className="w-fit rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/60 sm:tracking-[0.28em]">
                      {formatDate(nextGame.startsAt, locale)}
                    </div>
                  ) : null}
                </div>
                <div>
                  {nextGame ? (
                    <>
                      <p className="text-sm uppercase tracking-[0.3em] text-white/50">{nextGame.venue}</p>
                      <h2 className="mt-3 font-[var(--font-display)] text-4xl uppercase leading-none tracking-[0.06em] text-white sm:text-5xl lg:text-6xl lg:tracking-[0.08em]">
                        {nextGame.opponent}
                      </h2>
                      <p className="mt-4 max-w-lg text-sm leading-6 text-white/70 sm:leading-7">
                        {localizeText(locale, nextGame.summary)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                        {selectedSquad.code}
                      </p>
                      <h2 className="mt-3 font-[var(--font-display)] text-4xl uppercase leading-none tracking-[0.06em] text-white sm:text-5xl lg:tracking-[0.08em]">
                        {locale === "es" ? "Calendario en preparacion" : "Schedule in progress"}
                      </h2>
                      <p className="mt-4 max-w-lg text-sm leading-6 text-white/70 sm:leading-7">
                        {locale === "es"
                          ? `Todavia no hay juegos cargados para ${selectedSquad.code}.`
                          : `There are no games loaded for ${selectedSquad.code} yet.`}
                      </p>
                    </>
                  )}
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
          {nextGame ? (
            <>
              <h3 className="mt-4 font-[var(--font-display)] text-4xl uppercase tracking-[0.06em] text-white sm:text-5xl sm:tracking-[0.08em]">
                {nextGame.opponent}
              </h3>
              <p className="mt-2 text-white/65">{formatDate(nextGame.startsAt, locale)} • {nextGame.venue}</p>
              <p className="mt-4 text-sm leading-6 text-white/65">{localizeText(locale, nextGame.summary)}</p>
            </>
          ) : (
            <p className="mt-4 text-sm leading-6 text-white/65">
              {locale === "es"
                ? `No hay un proximo juego cargado para ${selectedSquad.code}.`
                : `There is no next game loaded for ${selectedSquad.code}.`}
            </p>
          )}
        </div>
        <div className="panel p-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-gold" />
            <p className="eyebrow">{dictionary.home.latestResult}</p>
          </div>
          {latestResult ? (
            <>
              <h3 className="mt-4 font-[var(--font-display)] text-4xl uppercase tracking-[0.06em] text-white sm:text-5xl sm:tracking-[0.08em]">
                {latestResult.homeScore} - {latestResult.awayScore}
              </h3>
              <p className="mt-2 text-white/65">{latestResult.opponent}</p>
              <p className="mt-4 text-sm leading-6 text-white/65">{localizeText(locale, latestResult.summary)}</p>
            </>
          ) : (
            <p className="mt-4 text-sm leading-6 text-white/65">
              {locale === "es"
                ? `Todavia no hay resultados finales para ${selectedSquad.code}.`
                : `There are no final results for ${selectedSquad.code} yet.`}
            </p>
          )}
        </div>
      </section>

      <section className="page-shell space-y-8">
        <SectionHeading
          eyebrow={dictionary.home.featuredPlayers}
          title={dictionary.home.featuredPlayers}
          body={localizeText(locale, settings.mission)}
        />
        {featuredPlayers.length ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {featuredPlayers.map((player) => (
              <PlayerCard key={`${player.id}-${player.assignment.squadId}`} locale={locale} player={player} />
            ))}
          </div>
        ) : (
          <div className="panel p-6 text-sm text-white/65">
            {locale === "es"
              ? `Todavia no hay jugadores destacados en ${selectedSquad.code}.`
              : `There are no featured players in ${selectedSquad.code} yet.`}
          </div>
        )}
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

      {nextGame ? (
        <section className="page-shell">
          <GameCard locale={locale} game={nextGame} />
        </section>
      ) : null}
    </main>
  );
}
