import Link from "next/link";

import { AdminModal } from "@/components/admin-modal";
import { AdminShell } from "@/components/admin-shell";
import { deleteGalleryAction, saveGalleryAction } from "@/lib/admin-actions";
import { getSiteData, sortGalleries } from "@/lib/content";
import { getDictionary, isLocale, toLocalDateTimeInputValue } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";
import { notFound } from "next/navigation";

function GalleryForm({
  locale,
  redirectTo,
  submitLabel,
  gallery
}: {
  locale: string;
  redirectTo: string;
  submitLabel: string;
  gallery?: (Awaited<ReturnType<typeof getSiteData>>)["galleries"][number];
}) {
  return (
    <form action={saveGalleryAction} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="id" value={gallery?.id ?? ""} />
      <input
        name="eventDate"
        type="datetime-local"
        defaultValue={toLocalDateTimeInputValue(gallery?.eventDate)}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <input
        name="coverImage"
        defaultValue={gallery?.coverImage ?? ""}
        placeholder="Cover image URL"
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <input
        name="titleEs"
        required
        defaultValue={gallery?.title.es ?? ""}
        placeholder="Title ES"
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <input
        name="titleEn"
        defaultValue={gallery?.title.en ?? ""}
        placeholder="Title EN"
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="descriptionEs"
        defaultValue={gallery?.description.es ?? ""}
        placeholder="Description ES"
        rows={4}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="descriptionEn"
        defaultValue={gallery?.description.en ?? ""}
        placeholder="Description EN"
        rows={4}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <select
        name="status"
        defaultValue={gallery?.status ?? "draft"}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      >
        <option className="bg-ink" value="draft">
          Draft
        </option>
        <option className="bg-ink" value="published">
          Published
        </option>
      </select>
      <button
        type="submit"
        className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-ink"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default async function AdminGalleriesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string; create?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireAdminSession(locale);

  const dictionary = getDictionary(locale);
  const data = await getSiteData();
  const galleries = sortGalleries(data.galleries);
  const basePath = `/${locale}/admin/galleries`;
  const editingGallery = query.edit
    ? galleries.find((gallery) => gallery.id === query.edit)
    : undefined;
  const isCreating = query.create === "1";

  return (
    <AdminShell locale={locale} labels={dictionary.admin}>
      <div className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-5xl uppercase tracking-[0.08em] text-white">
              Galleries
            </h1>
            <p className="mt-3 text-sm text-white/65">List view with quick actions and modal editing.</p>
          </div>
          <Link
            href={`${basePath}?create=1`}
            className="rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-ink"
          >
            New gallery
          </Link>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="divide-y divide-white/10">
          {galleries.map((gallery) => (
            <div key={gallery.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                  {gallery.eventDate.slice(0, 10)} • {gallery.status}
                </p>
                <p className="mt-2 font-[var(--font-display)] text-3xl uppercase tracking-[0.08em] text-white">
                  {gallery.title.es}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`${basePath}?edit=${gallery.id}`}
                  className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold"
                >
                  Edit
                </Link>
                <form action={deleteGalleryAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="redirectTo" value={basePath} />
                  <input type="hidden" name="id" value={gallery.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-red-200"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(editingGallery || isCreating) && (
        <AdminModal
          title={editingGallery ? `Edit ${editingGallery.title.es}` : "New gallery"}
          closeHref={basePath}
        >
          <GalleryForm
            locale={locale}
            redirectTo={basePath}
            submitLabel={editingGallery ? "Update gallery" : "Create gallery"}
            gallery={editingGallery}
          />
        </AdminModal>
      )}
    </AdminShell>
  );
}
