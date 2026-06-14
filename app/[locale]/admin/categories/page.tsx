import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminModal } from "@/components/admin-modal";
import { AdminShell } from "@/components/admin-shell";
import { deleteSquadAction, saveSquadAction } from "@/lib/admin-actions";
import { getSiteData } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";

function getMessage(locale: "es" | "en", error?: string, notice?: string) {
  if (notice === "category-created") {
    return { tone: "success", text: locale === "es" ? "Categoria creada." : "Category created." };
  }
  if (notice === "category-updated") {
    return { tone: "success", text: locale === "es" ? "Categoria actualizada." : "Category updated." };
  }
  if (notice === "category-deleted") {
    return { tone: "success", text: locale === "es" ? "Categoria eliminada." : "Category deleted." };
  }
  if (error === "invalid-category-input") {
    return {
      tone: "error",
      text: locale === "es" ? "Completa codigo y nombre en espanol." : "Code and Spanish name are required."
    };
  }
  if (error === "category-save-failed") {
    return {
      tone: "error",
      text: locale === "es" ? "No se pudo guardar la categoria." : "Could not save category."
    };
  }
  if (error === "category-delete-failed") {
    return {
      tone: "error",
      text: locale === "es" ? "No se pudo eliminar la categoria." : "Could not delete category."
    };
  }
  if (error === "category-delete-blocked") {
    return {
      tone: "error",
      text:
        locale === "es"
          ? "La categoria tiene datos vinculados y no se puede eliminar."
          : "This category has linked data and cannot be deleted."
    };
  }
  if (error === "category-delete-last") {
    return {
      tone: "error",
      text: locale === "es" ? "No puedes eliminar la ultima categoria." : "You cannot delete the last category."
    };
  }
  if (error === "category-not-found") {
    return {
      tone: "error",
      text: locale === "es" ? "Categoria no encontrada." : "Category not found."
    };
  }
  return null;
}

function CategoryForm({
  locale,
  redirectTo,
  squad
}: {
  locale: "es" | "en";
  redirectTo: string;
  squad?: (Awaited<ReturnType<typeof getSiteData>>)["squads"][number];
}) {
  return (
    <form action={saveSquadAction} className="grid gap-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="id" value={squad?.id ?? ""} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {locale === "es" ? "Codigo" : "Code"}
          <input
            name="code"
            required
            defaultValue={squad?.code ?? ""}
            placeholder={locale === "es" ? "A1" : "A1"}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
        <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {locale === "es" ? "Orden" : "Sort order"}
          <input
            name="sortOrder"
            type="number"
            defaultValue={squad?.sortOrder ?? 99}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {locale === "es" ? "Nombre ES" : "Name ES"}
          <input
            name="nameEs"
            required
            defaultValue={squad?.name.es ?? ""}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
        <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {locale === "es" ? "Nombre EN" : "Name EN"}
          <input
            name="nameEn"
            defaultValue={squad?.name.en ?? ""}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
          <input type="checkbox" name="isDefault" defaultChecked={squad?.isDefault ?? false} className="h-4 w-4" />
          {locale === "es" ? "Categoria por defecto" : "Default category"}
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
          <input type="checkbox" name="isActive" defaultChecked={squad?.isActive ?? true} className="h-4 w-4" />
          {locale === "es" ? "Categoria activa" : "Active category"}
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
        >
          {squad
            ? locale === "es"
              ? "Actualizar categoria"
              : "Update category"
            : locale === "es"
              ? "Crear categoria"
              : "Create category"}
        </button>
      </div>
    </form>
  );
}

export default async function AdminCategoriesPage({
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
  const squads = [...data.squads].sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
  const redirectTo = `/${locale}/admin/categories`;
  const message = getMessage(locale, query.error, query.notice);
  const editingSquad = query.edit ? squads.find((squad) => squad.id === query.edit) : undefined;

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
              {dictionary.admin.categoriesTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/65">
              {dictionary.admin.categoriesSubtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              {squads.length} {locale === "es" ? "categorias" : "categories"}
            </div>
            <Link
              href={`${redirectTo}?create=true`}
              className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
            >
              {dictionary.admin.newCategory}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {squads.map((squad) => (
            <article
              key={squad.id}
              className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold text-white">{squad.name.es}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-white/60">
                      {squad.code}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-white/60">
                      {locale === "es" ? `Orden ${squad.sortOrder}` : `Order ${squad.sortOrder}`}
                    </span>
                    {squad.isDefault ? (
                      <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-gold">
                        {dictionary.admin.defaultCategoryLabel}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full border px-3 py-1 ${
                        squad.isActive
                          ? "border-gold/25 bg-gold/10 text-gold"
                          : "border-white/10 text-white/45"
                      }`}
                    >
                      {squad.isActive ? dictionary.admin.active : dictionary.admin.inactive}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-white/55">{squad.name.en}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`${redirectTo}?edit=${squad.id}`}
                    className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold"
                  >
                    {dictionary.admin.edit}
                  </Link>
                  <form action={deleteSquadAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <input type="hidden" name="id" value={squad.id} />
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
          title={dictionary.admin.newCategory}
          closeHref={redirectTo}
          closeLabel={dictionary.admin.close}
        >
          <CategoryForm locale={locale} redirectTo={redirectTo} />
        </AdminModal>
      ) : null}

      {editingSquad ? (
        <AdminModal
          title={`${dictionary.admin.edit} ${editingSquad.code}`}
          closeHref={redirectTo}
          closeLabel={dictionary.admin.close}
        >
          <CategoryForm locale={locale} redirectTo={redirectTo} squad={editingSquad} />
        </AdminModal>
      ) : null}
    </AdminShell>
  );
}
