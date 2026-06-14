import { SeasonSwitch } from "@/components/season-switch";
import { SquadSwitch } from "@/components/squad-switch";
import { ScheduleBoard } from "@/components/schedule-board";
import { SectionHeading } from "@/components/section-heading";
import { getGamesPayload, localizeText } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function GamesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ squad?: string; season?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const data = await getGamesPayload(locale, query.squad, query.season);

  return (
    <main className="page-shell space-y-10">
      <SectionHeading
        eyebrow="Schedule"
        title={`${dictionary.games.title} ${data.selectedSquad.code} • ${data.activeSeason.label}`}
        body={`${dictionary.games.subtitle} ${localizeText(locale, data.selectedSquad.name)}.`}
      />
      <SeasonSwitch
        basePath={`/${locale}/games`}
        seasons={data.seasons}
        selectedSeasonId={data.activeSeason.id}
        extraParams={{ squad: data.selectedSquad.id }}
      />
      <SquadSwitch
        basePath={`/${locale}/games`}
        squads={data.squads}
        selectedSquadId={data.selectedSquad.id}
        extraParams={{ season: data.activeSeason.id }}
      />
      <ScheduleBoard
        locale={locale}
        games={data.games}
        labels={{
          all: dictionary.common.all,
          upcoming: dictionary.common.upcoming,
          final: dictionary.common.final
        }}
        emptyLabel={
          locale === "es"
            ? `Todavia no hay juegos cargados para ${data.selectedSquad.code}.`
            : `There are no games loaded for ${data.selectedSquad.code} yet.`
        }
      />
    </main>
  );
}
