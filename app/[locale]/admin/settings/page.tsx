import { AdminShell } from "@/components/admin-shell";
import { ImageUploadField } from "@/components/image-upload-field";
import { getSiteData } from "@/lib/content";
import { saveSiteSettingsAction } from "@/lib/admin-actions";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";
import { notFound } from "next/navigation";

export default async function AdminSettingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireAdminSession(locale);

  const dictionary = getDictionary(locale);
  const data = await getSiteData();

  return (
    <AdminShell locale={locale} labels={dictionary.admin}>
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
    </AdminShell>
  );
}
