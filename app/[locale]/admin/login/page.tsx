import { notFound } from "next/navigation";

import { getDictionary, isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <main className="page-shell flex min-h-[70vh] items-center justify-center">
      <div className="panel-dark w-full max-w-md p-8">
        <p className="eyebrow">{dictionary.admin.loginEyebrow}</p>
        <h1 className="mt-4 font-[var(--font-display)] text-5xl uppercase tracking-[0.08em] text-white">
          {dictionary.admin.loginTitle}
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/68">
          {dictionary.admin.loginBody}
        </p>
        {error ? (
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error === "setup"
              ? locale === "es"
                ? "Supabase auth todavia no esta configurado."
                : "Supabase auth is not configured yet."
              : error === "unauthorized"
                ? locale === "es"
                  ? "Las credenciales son validas, pero este usuario no esta habilitado en la tabla admins."
                  : "The credentials are valid, but this user is not enabled in the admins table."
                : locale === "es"
                  ? "Email o contrasena invalidos."
                  : "Invalid email or password."}
          </div>
        ) : null}
        <form action={`/api/auth/login?locale=${locale}`} method="post" className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.28em] text-white/45">{dictionary.admin.email}</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.28em] text-white/45">{dictionary.admin.password}</span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-gold px-4 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-ink"
          >
            {dictionary.admin.login}
          </button>
        </form>
      </div>
    </main>
  );
}
