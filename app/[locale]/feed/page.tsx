import { FeedBoard } from "@/components/feed-board";
import { SectionHeading } from "@/components/section-heading";
import { getSiteData, sortPosts } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function FeedPage({
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
      <SectionHeading eyebrow="Feed" title={dictionary.feed.title} body={dictionary.feed.subtitle} />
      <FeedBoard locale={locale} posts={sortPosts(data.posts)} />
    </main>
  );
}
