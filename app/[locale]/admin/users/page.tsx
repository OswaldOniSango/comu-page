import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminModal } from "@/components/admin-modal";
import { AdminShell } from "@/components/admin-shell";
import {
  createAdminUserAction,
  deleteAdminUserAction,
  updateAdminUserAction
} from "@/lib/admin-actions";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireSuperAdminSession } from "@/lib/session";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase";
import type { AdminRole, AdminUser } from "@/lib/types";

function getMessage(error?: string, notice?: string) {
  if (notice === "user-created") {
    return { tone: "success", text: "Admin user created." };
  }
  if (notice === "user-updated") {
    return { tone: "success", text: "Admin user updated." };
  }
  if (notice === "current-user-updated") {
    return { tone: "success", text: "Your admin account was updated." };
  }
  if (notice === "user-deleted") {
    return { tone: "success", text: "Admin user deleted." };
  }
  if (error === "password-too-short") {
    return { tone: "error", text: "Password must be at least 8 characters." };
  }
  if (error === "invalid-user-input") {
    return { tone: "error", text: "Check email, password and role." };
  }
  if (error === "user-create-failed") {
    return { tone: "error", text: "Could not create admin user." };
  }
  if (error === "user-update-failed") {
    return { tone: "error", text: "Could not update admin user." };
  }
  if (error === "user-delete-failed") {
    return { tone: "error", text: "Could not delete admin user." };
  }
  if (error === "user-not-found") {
    return { tone: "error", text: "Admin user not found." };
  }
  if (error === "self-delete") {
    return { tone: "error", text: "You cannot delete your own admin account from here." };
  }
  if (error === "last-superadmin") {
    return { tone: "error", text: "You cannot remove or deactivate the last superadmin." };
  }
  if (error === "setup") {
    return { tone: "error", text: "Supabase admin auth is not configured." };
  }
  return null;
}

async function getAdminUsers() {
  if (!isSupabaseConfigured()) {
    return [] as AdminUser[];
  }

  const client = createAdminClient();
  if (!client) {
    return [] as AdminUser[];
  }

  const { data } = await client
    .from("admins")
    .select("user_id, email, role, is_active, created_at")
    .order("role", { ascending: false })
    .order("email", { ascending: true });

  return ((data ?? []) as Array<{
    user_id: string;
    email: string;
    role: AdminRole;
    is_active: boolean;
    created_at: string;
  }>).map((item) => ({
    userId: item.user_id,
    email: item.email,
    role: (item.role === "superadmin" ? "superadmin" : "admin") as AdminRole,
    isActive: item.is_active,
    createdAt: item.created_at
  }));
}

function UserFormFields({
  mode,
  locale,
  redirectTo,
  user
}: {
  mode: "create" | "edit";
  locale: string;
  redirectTo: string;
  user?: AdminUser;
}) {
  return (
    <>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      {user ? <input type="hidden" name="userId" value={user.userId} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {locale === "es" ? "Email" : "Email"}
          <input
            name="email"
            type="email"
            required
            defaultValue={user?.email ?? ""}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
        <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {locale === "es" ? "Rol" : "Role"}
          <select
            name="role"
            defaultValue={user?.role ?? "admin"}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          >
            <option className="bg-ink" value="admin">
              Admin
            </option>
            <option className="bg-ink" value="superadmin">
              Superadmin
            </option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {mode === "create"
            ? locale === "es"
              ? "Contrasena temporal"
              : "Temporary password"
            : locale === "es"
              ? "Nueva contrasena"
              : "New password"}
          <input
            name="password"
            type="password"
            minLength={8}
            required={mode === "create"}
            placeholder={mode === "create" ? "Minimum 8 characters" : "Leave blank to keep"}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 md:mt-7">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={user ? user.isActive : true}
            className="h-4 w-4"
          />
          {locale === "es" ? "Usuario activo" : "Active user"}
        </label>
      </div>
    </>
  );
}

export default async function AdminUsersPage({
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

  await requireSuperAdminSession(locale);

  const dictionary = getDictionary(locale);
  const users = await getAdminUsers();
  const message = getMessage(query.error, query.notice);
  const redirectTo = `/${locale}/admin/users`;
  const userToEdit = query.edit ? users.find((user) => user.userId === query.edit) : undefined;

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
            <p className="eyebrow">Superadmin</p>
            <h1 className="mt-4 font-[var(--font-display)] text-5xl uppercase tracking-[0.08em] text-white">
              {dictionary.admin.usersTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/65">
              {dictionary.admin.usersSubtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              {users.length} users
            </div>
            <Link
              href={`${redirectTo}?create=true`}
              className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
            >
              {dictionary.admin.newUser}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {users.map((user) => (
            <article
              key={user.userId}
              className="rounded-[1.75rem] border border-white/10 bg-black/25 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold text-white">{user.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                    <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-gold">
                      {user.role}
                    </span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-white/60">
                      {user.isActive ? dictionary.admin.active : dictionary.admin.inactive}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`${redirectTo}?edit=${user.userId}`}
                    className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold"
                  >
                    {dictionary.admin.edit}
                  </Link>
                  <form action={deleteAdminUserAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <input type="hidden" name="userId" value={user.userId} />
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
        <AdminModal title={dictionary.admin.newUser} closeHref={redirectTo} closeLabel={dictionary.admin.close}>
          <form action={createAdminUserAction} className="grid gap-5">
            <UserFormFields mode="create" locale={locale} redirectTo={redirectTo} />
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink"
              >
                {dictionary.admin.createUser}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      {userToEdit ? (
        <AdminModal
          title={locale === "es" ? "Editar usuario" : "Edit user"}
          closeHref={redirectTo}
          closeLabel={dictionary.admin.close}
        >
          <form action={updateAdminUserAction} className="grid gap-5">
            <UserFormFields mode="edit" locale={locale} redirectTo={redirectTo} user={userToEdit} />
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-full border border-gold/30 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold"
              >
                {dictionary.admin.saveChanges}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </AdminShell>
  );
}
