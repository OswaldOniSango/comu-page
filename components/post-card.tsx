import Image from "next/image";
import Link from "next/link";

import { localizeText } from "@/lib/content";
import { formatDate } from "@/lib/i18n";
import type { Locale, Post } from "@/lib/types";

type Props = {
  locale: Locale;
  post: Post;
};

export function PostCard({ locale, post }: Props) {
  return (
    <Link href={`/${locale}/feed/${post.slug}`} className="group panel overflow-hidden hover:border-gold/30">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={post.coverImage}
          alt={localizeText(locale, post.title)}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{post.kind}</p>
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">
            {formatDate(post.publishedAt, locale)}
          </p>
        </div>
        <h3 className="font-[var(--font-display)] text-4xl uppercase tracking-[0.08em] text-white">
          {localizeText(locale, post.title)}
        </h3>
        <p className="text-sm leading-6 text-white/65">{localizeText(locale, post.excerpt)}</p>
      </div>
    </Link>
  );
}
