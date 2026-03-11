import { AdminShell } from "@/components/admin-shell";
import { StatCard } from "@/components/stat-card";
import { getSiteData, sortGames, sortPosts } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function AdminDashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireAdminSession(locale);

  const dictionary = getDictionary(locale);
  const data = await getSiteData();
  const upcoming = sortGames(data.games).filter((game) => game.status === "scheduled").slice(0, 3);
  const recentPosts = sortPosts(data.posts).slice(0, 3);

  return (
    <AdminShell locale={locale} labels={dictionary.admin}>
      {!isSupabaseConfigured() ? (
        <div className="panel border-gold/20 bg-gold/10 p-5 text-sm text-white/75">
          Running in seed mode. Public pages render demo data until Supabase environment variables are configured.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Players" value={`${data.players.length}`} accent />
        <StatCard label="Games" value={`${data.games.length}`} />
        <StatCard label="Posts" value={`${data.posts.length}`} />
        <StatCard label="Galleries" value={`${data.galleries.length}`} />
      </div>
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-6">
          <h2 className="font-[var(--font-display)] text-4xl uppercase tracking-[0.08em] text-white">
            Upcoming games
          </h2>
          <div className="mt-6 space-y-4">
            {upcoming.map((game) => (
              <div key={game.id} className="rounded-2xl border border-white/10 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">{game.status}</p>
                <p className="mt-2 font-[var(--font-display)] text-3xl uppercase tracking-[0.08em] text-white">
                  {game.opponent}
                </p>
                <p className="text-sm text-white/65">{game.venue}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-6">
          <h2 className="font-[var(--font-display)] text-4xl uppercase tracking-[0.08em] text-white">
            Drafts and latest posts
          </h2>
          <div className="mt-6 space-y-4">
            {recentPosts.map((post) => (
              <div key={post.id} className="rounded-2xl border border-white/10 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-gold">{post.kind}</p>
                <p className="mt-2 font-[var(--font-display)] text-3xl uppercase tracking-[0.08em] text-white">
                  {post.title.es}
                </p>
                <p className="text-sm text-white/65">{post.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
