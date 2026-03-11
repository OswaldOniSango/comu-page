import Link from "next/link";

import { AdminModal } from "@/components/admin-modal";
import { AdminShell } from "@/components/admin-shell";
import { deletePostAction, savePostAction } from "@/lib/admin-actions";
import { getSiteData, sortPosts } from "@/lib/content";
import { getDictionary, isLocale, toLocalDateTimeInputValue } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";
import { notFound } from "next/navigation";

function PostForm({
  locale,
  redirectTo,
  submitLabel,
  post
}: {
  locale: string;
  redirectTo: string;
  submitLabel: string;
  post?: (Awaited<ReturnType<typeof getSiteData>>)["posts"][number];
}) {
  return (
    <form action={savePostAction} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="id" value={post?.id ?? ""} />
      <input type="hidden" name="seasonId" value={post?.seasonId ?? "season-2026"} />
      <div className="grid gap-4 md:grid-cols-2">
        <select
          name="kind"
          defaultValue={post?.kind ?? "news"}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        >
          <option className="bg-ink" value="news">
            News
          </option>
          <option className="bg-ink" value="announcement">
            Announcement
          </option>
          <option className="bg-ink" value="recap">
            Recap
          </option>
        </select>
        <select
          name="status"
          defaultValue={post?.status ?? "draft"}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        >
          <option className="bg-ink" value="draft">
            Draft
          </option>
          <option className="bg-ink" value="published">
            Published
          </option>
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="publishedAt"
          type="datetime-local"
          defaultValue={toLocalDateTimeInputValue(post?.publishedAt)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="authorName"
          defaultValue={post?.authorName ?? ""}
          placeholder="Author"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>
      <input
        name="coverImage"
        defaultValue={post?.coverImage ?? ""}
        placeholder="Cover image URL"
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <input
        name="titleEs"
        required
        defaultValue={post?.title.es ?? ""}
        placeholder="Title ES"
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <input
        name="titleEn"
        defaultValue={post?.title.en ?? ""}
        placeholder="Title EN"
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="excerptEs"
        defaultValue={post?.excerpt.es ?? ""}
        placeholder="Excerpt ES"
        rows={2}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="excerptEn"
        defaultValue={post?.excerpt.en ?? ""}
        placeholder="Excerpt EN"
        rows={2}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="bodyEs"
        defaultValue={post?.body.es ?? ""}
        placeholder="Body ES"
        rows={5}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="bodyEn"
        defaultValue={post?.body.en ?? ""}
        placeholder="Body EN"
        rows={5}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/65">
        <input
          name="featured"
          type="checkbox"
          defaultChecked={post?.featured ?? false}
          className="h-4 w-4 rounded border-white/20 bg-transparent"
        />
        Featured post
      </label>
      <button
        type="submit"
        className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-ink"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default async function AdminPostsPage({
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
  const posts = sortPosts(data.posts);
  const basePath = `/${locale}/admin/posts`;
  const editingPost = query.edit ? posts.find((post) => post.id === query.edit) : undefined;
  const isCreating = query.create === "1";

  return (
    <AdminShell locale={locale} labels={dictionary.admin}>
      <div className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-5xl uppercase tracking-[0.08em] text-white">
              Editorial feed
            </h1>
            <p className="mt-3 text-sm text-white/65">Work from a clean list instead of inline forms.</p>
          </div>
          <Link
            href={`${basePath}?create=1`}
            className="rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-ink"
          >
            New post
          </Link>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="divide-y divide-white/10">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gold">{post.kind}</p>
                <p className="mt-2 font-[var(--font-display)] text-3xl uppercase tracking-[0.08em] text-white">
                  {post.title.es}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`${basePath}?edit=${post.id}`}
                  className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold"
                >
                  Edit
                </Link>
                <form action={deletePostAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="redirectTo" value={basePath} />
                  <input type="hidden" name="id" value={post.id} />
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

      {(editingPost || isCreating) && (
        <AdminModal title={editingPost ? `Edit ${editingPost.title.es}` : "New post"} closeHref={basePath}>
          <PostForm
            locale={locale}
            redirectTo={basePath}
            submitLabel={editingPost ? "Update post" : "Create post"}
            post={editingPost}
          />
        </AdminModal>
      )}
    </AdminShell>
  );
}
