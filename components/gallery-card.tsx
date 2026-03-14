import Image from "next/image";
import Link from "next/link";

import { localizeText } from "@/lib/content";
import { formatDate } from "@/lib/i18n";
import type { Gallery, Locale } from "@/lib/types";

type Props = {
  locale: Locale;
  gallery: Gallery;
};

export function GalleryCard({ locale, gallery }: Props) {
  return (
    <Link
      href={`/${locale}/gallery/${gallery.slug}`}
      className="group panel overflow-hidden hover:border-gold/30"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <Image
          src={gallery.coverImage}
          alt={localizeText(locale, gallery.title)}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>
      <div className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-white/45">
          {formatDate(gallery.eventDate, locale)}
        </p>
        <h3 className="font-[var(--font-display)] text-3xl uppercase tracking-[0.06em] text-white sm:text-4xl sm:tracking-[0.08em]">
          {localizeText(locale, gallery.title)}
        </h3>
        <p className="text-sm leading-6 text-white/65">{localizeText(locale, gallery.description)}</p>
      </div>
    </Link>
  );
}
