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
    <aside className="panel sticky top-24 h-fit p-5">
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
  );
}
