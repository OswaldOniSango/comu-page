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
  common?: {
    club?: string;
    menu?: string;
    open?: string;
  };
};

export function SiteHeader({ locale, nav, common }: Props) {
  const items = [
    { href: `/${locale}`, label: nav.home },
    { href: `/${locale}/roster`, label: nav.roster },
    { href: `/${locale}/games`, label: nav.games },
    { href: `/${locale}/feed`, label: nav.feed },
    { href: `/${locale}/gallery`, label: nav.gallery },
    { href: `/${locale}/about`, label: nav.about }
  ];

  return (
    <header className="sticky top-0 z-40 overflow-x-clip border-b border-white/10 bg-black/65 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl min-w-0 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/${locale}`}
            className="flex min-w-0 items-center gap-3 lg:min-w-[320px] lg:flex-[0_0_320px] xl:min-w-[360px] xl:flex-[0_0_360px]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold text-lg font-black text-ink sm:h-11 sm:w-11 sm:text-xl">
              C
            </div>
            <div className="min-w-0">
              <p className="truncate font-[var(--font-display)] text-lg uppercase tracking-[0.12em] text-white sm:text-2xl sm:tracking-[0.14em]">
                Comunicaciones
              </p>
              <p className="truncate text-[10px] uppercase tracking-[0.24em] text-white/45 sm:text-xs sm:tracking-[0.3em]">
                {common?.club ?? "Baseball Club"}
              </p>
            </div>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 xl:gap-6 lg:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-gold xl:text-sm xl:tracking-[0.24em]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Link
              href={`/${locale}/admin`}
              className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold hover:bg-gold hover:text-ink"
            >
              {nav.admin}
            </Link>
            <LocaleSwitcher currentLocale={locale} />
          </div>

          <div className="lg:hidden">
            <LocaleSwitcher currentLocale={locale} />
          </div>
        </div>
        <details className="mt-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
                {common?.menu ?? "Menu"}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/50">
                {items.length + 1} links
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
              {common?.open ?? "Open"}
            </span>
          </summary>
          <nav className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-black/35 p-3">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/75"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/admin`}
              className="rounded-2xl border border-gold/40 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold"
            >
              {nav.admin}
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
