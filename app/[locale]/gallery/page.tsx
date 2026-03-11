import { GalleryCard } from "@/components/gallery-card";
import { SectionHeading } from "@/components/section-heading";
import { getSiteData, sortGalleries } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function GalleryPage({
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
        eyebrow="Gallery"
        title={dictionary.gallery.title}
        body={dictionary.gallery.subtitle}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {sortGalleries(data.galleries).map((gallery) => (
          <GalleryCard key={gallery.id} locale={locale} gallery={gallery} />
        ))}
      </div>
    </main>
  );
}
