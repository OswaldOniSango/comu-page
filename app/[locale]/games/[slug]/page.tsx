import Image from "next/image";
import { notFound } from "next/navigation";

import { GalleryCard } from "@/components/gallery-card";
import { SectionHeading } from "@/components/section-heading";
import { getGameBySlug, getGalleryBySlug, localizeText } from "@/lib/content";
import { formatDate, isLocale } from "@/lib/i18n";

export default async function GamePage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ squad?: string }>;
}) {
  const { locale, slug } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  const game = await getGameBySlug(slug, query.squad);
  if (!game) {
    notFound();
  }

  const relatedGallery = game.gallerySlug ? await getGalleryBySlug(game.gallerySlug) : null;

  return (
    <main className="page-shell space-y-10">
      <section className="panel-dark overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[380px]">
            <Image
              src={game.coverImage}
              alt={localizeText(locale, game.headline)}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          </div>
          <div className="flex flex-col justify-center p-8">
            <p className="eyebrow">{game.squadId.toUpperCase()} • {game.status}</p>
            <h1 className="mt-4 font-[var(--font-display)] text-6xl uppercase leading-none tracking-[0.08em] text-white">
              {game.opponent}
            </h1>
            <p className="mt-4 text-white/65">{formatDate(game.startsAt, locale)} • {game.venue}</p>
            {game.status === "final" ? (
              <p className="mt-5 font-[var(--font-display)] text-5xl uppercase tracking-[0.08em] text-gold">
                {game.homeScore} - {game.awayScore}
              </p>
            ) : null}
            <p className="mt-6 text-base leading-7 text-white/68">{localizeText(locale, game.summary)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <SectionHeading eyebrow="Headline" title={localizeText(locale, game.headline)} />
        </div>
        <div className="panel p-6">
          <SectionHeading
            eyebrow="Key moment"
            title={localizeText(locale, game.keyMoment ?? game.summary)}
          />
        </div>
      </section>

      {relatedGallery ? (
        <section className="space-y-6">
          <SectionHeading eyebrow="Gallery" title="Related album" />
          <GalleryCard locale={locale} gallery={relatedGallery} />
        </section>
      ) : null}
    </main>
  );
}
