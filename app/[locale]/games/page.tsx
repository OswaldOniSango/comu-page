import { ScheduleBoard } from "@/components/schedule-board";
import { SectionHeading } from "@/components/section-heading";
import { getSiteData, sortGames } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function GamesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const data = await getSiteData();

  return (
    <main className="page-shell space-y-10">
      <SectionHeading
        eyebrow="Schedule"
        title={dictionary.games.title}
        body={dictionary.games.subtitle}
      />
      <ScheduleBoard
        locale={locale}
        games={sortGames(data.games)}
        labels={{
          all: dictionary.common.all,
          upcoming: dictionary.common.upcoming,
          final: dictionary.common.final
        }}
      />
    </main>
  );
}
