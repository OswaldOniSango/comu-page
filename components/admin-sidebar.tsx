import Link from "next/link";

import type { Locale } from "@/lib/types";

type Props = {
  locale: Locale;
  labels: {
    dashboard: string;
    players: string;
    games: string;
    posts: string;
    galleries: string;
    stats: string;
    settings: string;
  };
};

export function AdminSidebar({ locale, labels }: Props) {
  const items = [
    { href: `/${locale}/admin`, label: labels.dashboard },
    { href: `/${locale}/admin/players`, label: labels.players },
    { href: `/${locale}/admin/games`, label: labels.games },
    { href: `/${locale}/admin/posts`, label: labels.posts },
    { href: `/${locale}/admin/galleries`, label: labels.galleries },
    { href: `/${locale}/admin/stats`, label: labels.stats },
    { href: `/${locale}/admin/settings`, label: labels.settings }
  ];

  return (
    <>
      <div className="panel p-4 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">Control room</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Admin
          </p>
        </div>
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 hover:border-gold/20 hover:bg-gold/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <aside className="panel sticky top-24 hidden h-fit p-5 lg:block">
        <p className="eyebrow">Control room</p>
        <div className="mt-5 space-y-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white/65 hover:border-gold/20 hover:bg-gold/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
