import Link from "next/link";

import type { Locale } from "@/lib/types";

type Props = {
  locale: Locale;
  teamName: string;
};

export function SiteFooter({ locale, teamName }: Props) {
  return (
    <footer className="border-t border-white/10 bg-black/40">
      <div className="page-shell grid gap-6 py-10 md:grid-cols-2">
        <div>
          <p className="font-[var(--font-display)] text-2xl uppercase tracking-[0.16em] text-gold">
            {teamName}
          </p>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Yellow and black baseball identity built for roster management, schedules, recaps and
            visual storytelling.
          </p>
        </div>
        <div className="flex items-end justify-start md:justify-end">
          <Link
            href={`/${locale}/admin`}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 hover:border-gold hover:text-gold"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
