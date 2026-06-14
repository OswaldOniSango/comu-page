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
    users?: string;
    settings: string;
    controlRoom?: string;
    open?: string;
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
    ...(labels.users ? [{ href: `/${locale}/admin/users`, label: labels.users }] : []),
    { href: `/${locale}/admin/settings`, label: labels.settings }
  ];

  return (
    <>
      <div className="panel p-4 lg:hidden">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="eyebrow">{labels.controlRoom ?? "Control room"}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Admin
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
              {labels.open ?? "Open"}
            </span>
          </summary>
          <div className="mt-4 grid gap-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70 hover:border-gold/20 hover:bg-gold/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </details>
      </div>

      <aside className="panel sticky top-24 hidden h-fit p-5 lg:block">
        <p className="eyebrow">{labels.controlRoom ?? "Control room"}</p>
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
