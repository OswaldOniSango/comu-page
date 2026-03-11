import Image from "next/image";
import { notFound } from "next/navigation";

import { getPostBySlug, localizeText } from "@/lib/content";
import { formatDate, isLocale } from "@/lib/i18n";

export default async function PostPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const post = await getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  return (
    <main className="page-shell space-y-8">
      <div className="panel-dark overflow-hidden">
        <div className="relative aspect-[16/8]">
          <Image src={post.coverImage} alt={localizeText(locale, post.title)} fill className="object-cover" />
        </div>
      </div>
      <article className="mx-auto max-w-4xl space-y-6">
        <p className="eyebrow">{post.kind}</p>
        <h1 className="font-[var(--font-display)] text-7xl uppercase leading-none tracking-[0.08em] text-white">
          {localizeText(locale, post.title)}
        </h1>
        <p className="text-sm uppercase tracking-[0.24em] text-white/45">
          {post.authorName} • {formatDate(post.publishedAt, locale)}
        </p>
        <p className="text-lg leading-8 text-white/70">{localizeText(locale, post.excerpt)}</p>
        <div className="panel p-8 text-base leading-8 text-white/78">
          {localizeText(locale, post.body)}
        </div>
      </article>
    </main>
  );
}
