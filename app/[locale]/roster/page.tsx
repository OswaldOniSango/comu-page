import { RosterGrid } from "@/components/roster-grid";
import { SectionHeading } from "@/components/section-heading";
import { getSiteData, sortPlayers } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function RosterPage({
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
        eyebrow="Roster"
        title={dictionary.roster.title}
        body={dictionary.roster.subtitle}
      />
      <RosterGrid
        locale={locale}
        players={sortPlayers(data.players.filter((player) => player.status === "published"))}
        searchLabel={dictionary.roster.search}
        filterLabel={dictionary.roster.filter}
        allPositionsLabel={dictionary.roster.allPositions}
      />
    </main>
  );
}
