import { SquadSwitch } from "@/components/squad-switch";
import { RosterGrid } from "@/components/roster-grid";
import { SectionHeading } from "@/components/section-heading";
import { getRosterPayload, localizeText } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function RosterPage({
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
  const data = await getRosterPayload(locale, query.squad);

  return (
    <main className="page-shell space-y-10">
      <SectionHeading
        eyebrow="Roster"
        title={`${dictionary.roster.title} ${data.selectedSquad.code}`}
        body={`${dictionary.roster.subtitle} ${localizeText(locale, data.selectedSquad.name)}.`}
      />
      <SquadSwitch
        basePath={`/${locale}/roster`}
        squads={data.squads}
        selectedSquadId={data.selectedSquad.id}
      />
      <RosterGrid
        locale={locale}
        players={data.players}
        searchLabel={dictionary.roster.search}
        filterLabel={dictionary.roster.filter}
        allPositionsLabel={dictionary.roster.allPositions}
        emptyLabel={
          locale === "es"
            ? `Todavia no hay jugadores publicados para ${data.selectedSquad.code}.`
            : `There are no published players for ${data.selectedSquad.code} yet.`
        }
      />
    </main>
  );
}
