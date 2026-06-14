import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminModal } from "@/components/admin-modal";
import { AdminShell } from "@/components/admin-shell";
import { deleteSeasonAction, saveSeasonAction } from "@/lib/admin-actions";
import { getSiteData } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";

function getMessage(locale: "es" | "en", error?: string, notice?: string) {
  if (notice === "season-created") {
    return { tone: "success", text: locale === "es" ? "Temporada creada." : "Season created." };
  }
  if (notice === "season-updated") {
    return { tone: "success", text: locale === "es" ? "Temporada actualizada." : "Season updated." };
  }
  if (notice === "season-deleted") {
    return { tone: "success", text: locale === "es" ? "Temporada eliminada." : "Season deleted." };
  }
  if (error === "invalid-season-input") {
    return {
      tone: "error",
      text: locale === "es" ? "Completa ano y etiqueta." : "Year and label are required."
    };
  }
  if (error === "season-save-failed") {
    return {
      tone: "error",
      text: locale === "es" ? "No se pudo guardar la temporada." : "Could not save season."
    };
  }
  if (error === "season-delete-failed") {
    return {
      tone: "error",
      text: locale === "es" ? "No se pudo eliminar la temporada." : "Could not delete season."
    };
  }
  if (error === "season-delete-blocked") {
    return {
      tone: "error",
      text: locale === "es" ? "La temporada tiene datos vinculados y no se puede eliminar." : "This season has linked data and cannot be deleted."
    };
  }
  if (error === "season-delete-last") {
    return {
      tone: "error",
      text: locale === "es" ? "No puedes eliminar la ultima temporada." : "You cannot delete the last season."
    };
  }
  if (error === "season-not-found") {
    return {
      tone: "error",
      text: locale === "es" ? "Temporada no encontrada." : "Season not found."
    };
  }
  return null;
}

function SeasonForm({
  locale,
  redirectTo,
  season
}: {
  locale: "es" | "en";
  redirectTo: string;
  season?: (Awaited<ReturnType<typeof getSiteData>>)["seasons"][number];
}) {
  return (
    <form action={saveSeasonAction} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="id" value={season?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {locale === "es" ? "Ano" : "Year"}
          <input
            name="year"
            type="number"
            required
            defaultValue={season?.year ?? ""}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
        <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {locale === "es" ? "Etiqueta" : "Label"}
          <input
            name="label"
            required
            defaultValue={season?.label ?? ""}
            placeholder={locale === "es" ? "2026 Apertura" : "2026 Opening"}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {locale === "es" ? "Fecha inicio" : "Start date"}
          <input
            name="startsAt"
            type="date"
            defaultValue={season?.startsAt ?? ""}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
        <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {locale === "es" ? "Fecha fin" : "End date"}
          <input
            name="endsAt"
            type="date"
            defaultValue={season?.endsAt ?? ""}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
      </div>
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
        <input type="checkbox" name="isActive" defaultChecked={season?.active ?? true} className="h-4 w-4" />
        {locale === "es" ? "Temporada activa" : "Active season"}
      </label>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
        >
          {season
            ? locale === "es"
              ? "Actualizar temporada"
              : "Update season"
            : locale === "es"
              ? "Crear temporada"
              : "Create season"}
        </button>
      </div>
    </form>
  );
}

export default async function AdminSeasonsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ create?: string; edit?: string; error?: string; notice?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireAdminSession(locale);

  const dictionary = getDictionary(locale);
  const data = await getSiteData();
  const seasons = [...data.seasons].sort((a, b) => {
    const startA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
    const startB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
    return startB - startA || b.year - a.year;
  });
  const redirectTo = `/${locale}/admin/seasons`;
  const message = getMessage(locale, query.error, query.notice);
  const editingSeason = query.edit ? seasons.find((season) => season.id === query.edit) : undefined;

  return (
    <AdminShell locale={locale} labels={dictionary.admin}>
      {message ? (
        <div
          className={`panel p-4 text-sm ${
            message.tone === "success"
              ? "border-gold/20 bg-gold/10 text-white/85"
              : "border-red-400/30 bg-red-500/10 text-red-100"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="panel p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="mt-1 font-[var(--font-display)] text-5xl uppercase tracking-[0.08em] text-white">
              {dictionary.admin.seasonsTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/65">
              {dictionary.admin.seasonsSubtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              {seasons.length} {locale === "es" ? "temporadas" : "seasons"}
            </div>
            <Link
              href={`${redirectTo}?create=true`}
              className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
            >
              {dictionary.admin.newSeason}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {seasons.map((season) => (
            <article
              key={season.id}
              className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold text-white">{season.label}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-white/60">
                      {season.year}
                    </span>
                    {season.active ? (
                      <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-gold">
                        {dictionary.admin.activeSeasonLabel}
                      </span>
                    ) : null}
                    {season.startsAt ? (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-white/50">
                        {season.startsAt}
                      </span>
                    ) : null}
                    {season.endsAt ? (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-white/50">
                        {season.endsAt}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`${redirectTo}?edit=${season.id}`}
                    className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold"
                  >
                    {dictionary.admin.edit}
                  </Link>
                  <form action={deleteSeasonAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <input type="hidden" name="id" value={season.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-200"
                    >
                      {dictionary.admin.delete}
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {query.create === "true" ? (
        <AdminModal
          title={dictionary.admin.newSeason}
          closeHref={redirectTo}
          closeLabel={dictionary.admin.close}
        >
          <SeasonForm locale={locale} redirectTo={redirectTo} />
        </AdminModal>
      ) : null}

      {editingSeason ? (
        <AdminModal
          title={`${dictionary.admin.edit} ${editingSeason.label}`}
          closeHref={redirectTo}
          closeLabel={dictionary.admin.close}
        >
          <SeasonForm locale={locale} redirectTo={redirectTo} season={editingSeason} />
        </AdminModal>
      ) : null}
    </AdminShell>
  );
}
