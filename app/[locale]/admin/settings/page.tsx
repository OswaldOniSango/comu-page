import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { ImageUploadField } from "@/components/image-upload-field";
import { changeOwnAdminPasswordAction, saveSiteSettingsAction } from "@/lib/admin-actions";
import { getSiteData } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";

function getMessage(error?: string, notice?: string) {
  if (notice === "password-updated") {
    return { tone: "success", text: "Password updated." };
  }
  if (error === "password-too-short") {
    return { tone: "error", text: "Password must be at least 8 characters." };
  }
  if (error === "password-mismatch") {
    return { tone: "error", text: "Passwords do not match." };
  }
  if (error === "password-update-failed") {
    return { tone: "error", text: "Could not update password." };
  }
  if (error === "setup") {
    return { tone: "error", text: "Supabase admin auth is not configured." };
  }
  return null;
}

export default async function AdminSettingsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  const session = await requireAdminSession(locale);
  const dictionary = getDictionary(locale);
  const data = await getSiteData();
  const message = getMessage(query.error, query.notice);
  const redirectTo = `/${locale}/admin/settings`;

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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
        <form action={saveSiteSettingsAction} className="panel p-6">
          <input type="hidden" name="locale" value={locale} />
          <h1 className="font-[var(--font-display)] text-5xl uppercase tracking-[0.08em] text-white">
            Site settings
          </h1>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <input name="teamName" defaultValue={data.settings.teamName} placeholder="Team name" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <input name="shortName" defaultValue={data.settings.shortName} placeholder="Short name" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <input name="primaryColor" defaultValue={data.settings.primaryColor} placeholder="Primary color" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <input name="secondaryColor" defaultValue={data.settings.secondaryColor} placeholder="Secondary color" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <div className="xl:col-span-2">
              <ImageUploadField label="Hero image" name="heroImageFile" />
            </div>
            <input name="heroImage" defaultValue={data.settings.heroImage} placeholder="Existing hero image URL (optional fallback)" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white xl:col-span-2" />
            <div className="xl:col-span-2">
              <ImageUploadField label="Logo mark" name="logoFile" />
            </div>
            <input name="logo" defaultValue={data.settings.logoMark} placeholder="Existing logo URL (optional fallback)" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white xl:col-span-2" />
            <textarea name="taglineEs" defaultValue={data.settings.tagline.es} placeholder="Tagline ES" rows={3} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <textarea name="taglineEn" defaultValue={data.settings.tagline.en} placeholder="Tagline EN" rows={3} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <textarea name="missionEs" defaultValue={data.settings.mission.es} placeholder="Mission ES" rows={4} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <textarea name="missionEn" defaultValue={data.settings.mission.en} placeholder="Mission EN" rows={4} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <input name="instagram" defaultValue={data.settings.socialLinks.instagram} placeholder="Instagram URL" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <input name="facebook" defaultValue={data.settings.socialLinks.facebook} placeholder="Facebook URL" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            <input name="x" defaultValue={data.settings.socialLinks.x} placeholder="X URL" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white xl:col-span-2" />
          </div>
          <button type="submit" className="mt-6 rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-ink">
            Save settings
          </button>
        </form>

        <section className="panel p-6">
          <p className="eyebrow">Security</p>
          <h2 className="mt-4 font-[var(--font-display)] text-3xl uppercase tracking-[0.08em] text-white">
            Your account
          </h2>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
            <p>{session.email}</p>
            <p className="mt-2 uppercase tracking-[0.18em] text-gold">{session.role}</p>
          </div>

          <form action={changeOwnAdminPasswordAction} className="mt-5 space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              New password
              <input
                name="password"
                type="password"
                minLength={8}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                minLength={8}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            </label>
            <button
              type="submit"
              className="rounded-full border border-gold/30 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold"
            >
              Change password
            </button>
          </form>
        </section>
      </section>
    </AdminShell>
  );
}
