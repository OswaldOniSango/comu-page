import { AdminSidebar } from "@/components/admin-sidebar";
import { getAdminSession } from "@/lib/session";
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
    seasons?: string;
    categories?: string;
    users?: string;
    settings: string;
    signOut?: string;
    controlRoom?: string;
    open?: string;
  };
  children: React.ReactNode;
};

export async function AdminShell({ locale, labels, children }: Props) {
  const session = await getAdminSession();
  const sidebarLabels = {
    ...labels,
    users: session?.role === "superadmin" ? labels.users : undefined
  };

  return (
    <div className="page-shell admin-grid">
      <AdminSidebar locale={locale} labels={sidebarLabels} />
      <div className="min-w-0 space-y-4 lg:space-y-6">
        <div className="flex justify-start sm:justify-end">
          <form action={`/api/auth/logout?locale=${locale}`} method="post">
            <button
              type="submit"
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 hover:border-gold hover:text-gold"
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
