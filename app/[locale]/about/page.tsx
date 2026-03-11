import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";
import { getSiteData, localizeText } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function AboutPage({
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
        eyebrow="Club"
        title={dictionary.about.title}
        body={localizeText(locale, data.settings.mission)}
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel-dark p-8">
          <p className="eyebrow">Identity</p>
          <p className="mt-4 text-lg leading-8 text-white/70">{localizeText(locale, data.settings.tagline)}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Wins" value={`${data.teamStats.wins}`} accent />
            <StatCard label="Losses" value={`${data.teamStats.losses}`} />
            <StatCard label="Runs diff" value={`${data.teamStats.runsScored - data.teamStats.runsAllowed}`} />
          </div>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Visual system</p>
          <div className="mt-5 grid gap-4">
            <div className="rounded-3xl bg-gold p-6 text-ink">
              <p className="text-xs uppercase tracking-[0.3em]">Primary</p>
              <p className="mt-2 font-[var(--font-display)] text-5xl uppercase">{data.settings.primaryColor}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Secondary</p>
              <p className="mt-2 font-[var(--font-display)] text-5xl uppercase text-white">
                {data.settings.secondaryColor}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
