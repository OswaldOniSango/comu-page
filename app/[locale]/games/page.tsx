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
  searchParams: Promise<{ squad?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const data = await getGamesPayload(locale, query.squad);

  return (
    <main className="page-shell space-y-10">
      <SectionHeading
        eyebrow="Schedule"
        title={`${dictionary.games.title} ${data.selectedSquad.code}`}
        body={`${dictionary.games.subtitle} ${localizeText(locale, data.selectedSquad.name)}.`}
      />
      <SquadSwitch
        basePath={`/${locale}/games`}
        squads={data.squads}
        selectedSquadId={data.selectedSquad.id}
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
