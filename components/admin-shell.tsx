import { AdminSidebar } from "@/components/admin-sidebar";
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
    signOut?: string;
  };
  children: React.ReactNode;
};

export function AdminShell({ locale, labels, children }: Props) {
  return (
    <div className="page-shell admin-grid">
      <AdminSidebar locale={locale} labels={labels} />
      <div className="space-y-6">
        <div className="flex justify-end">
          <form action={`/api/auth/logout?locale=${locale}`} method="post">
            <button
              type="submit"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70 hover:border-gold hover:text-gold"
            >
              {labels.signOut ?? "Sign out"}
            </button>
          </form>
        </div>
        {children}
      </div>
    </div>
  );
}
