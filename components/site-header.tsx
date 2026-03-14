import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import type { Locale } from "@/lib/types";

type Props = {
  locale: Locale;
  nav: {
    home: string;
    roster: string;
    games: string;
    feed: string;
    gallery: string;
    about: string;
    admin: string;
  };
};

export function SiteHeader({ locale, nav }: Props) {
  const items = [
    { href: `/${locale}`, label: nav.home },
    { href: `/${locale}/roster`, label: nav.roster },
    { href: `/${locale}/games`, label: nav.games },
    { href: `/${locale}/feed`, label: nav.feed },
    { href: `/${locale}/gallery`, label: nav.gallery },
    { href: `/${locale}/about`, label: nav.about }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/65 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href={`/${locale}`} className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold text-lg font-black text-ink sm:h-11 sm:w-11 sm:text-xl">
              C
            </div>
            <div className="min-w-0">
              <p className="truncate font-[var(--font-display)] text-lg uppercase tracking-[0.12em] text-white sm:text-2xl sm:tracking-[0.14em]">
                Comunicaciones
              </p>
              <p className="truncate text-[10px] uppercase tracking-[0.24em] text-white/45 sm:text-xs sm:tracking-[0.3em]">
                Baseball Club
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70 hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/admin`}
              className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold hover:bg-gold hover:text-ink"
            >
              {nav.admin}
            </Link>
            <LocaleSwitcher currentLocale={locale} />
          </nav>

          <div className="lg:hidden">
            <LocaleSwitcher currentLocale={locale} />
          </div>
        </div>
        <nav className="mt-4 flex gap-4 overflow-x-auto pb-1 lg:hidden">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={`/${locale}/admin`}
            className="whitespace-nowrap rounded-full border border-gold/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold"
          >
            {nav.admin}
          </Link>
        </nav>
      </div>
    </header>
  );
}
