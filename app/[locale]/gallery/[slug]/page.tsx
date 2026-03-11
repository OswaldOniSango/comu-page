import Image from "next/image";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/section-heading";
import { getGalleryBySlug, localizeText } from "@/lib/content";
import { formatDate, isLocale } from "@/lib/i18n";

export default async function GalleryDetailPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const gallery = await getGalleryBySlug(slug);
  if (!gallery) {
    notFound();
  }

  return (
    <main className="page-shell space-y-10">
      <SectionHeading
        eyebrow={formatDate(gallery.eventDate, locale)}
        title={localizeText(locale, gallery.title)}
        body={localizeText(locale, gallery.description)}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {gallery.images
          .sort((a, b) => a.order - b.order)
          .map((image) => (
            <figure key={image.id} className="panel overflow-hidden">
              <div className="relative aspect-[4/3]">
                <Image src={image.image} alt={localizeText(locale, image.alt)} fill className="object-cover" />
              </div>
              {image.caption ? (
                <figcaption className="p-5 text-sm leading-6 text-white/65">
                  {localizeText(locale, image.caption)}
                </figcaption>
              ) : null}
            </figure>
          ))}
      </div>
    </main>
  );
}
