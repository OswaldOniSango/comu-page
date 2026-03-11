import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteData } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateStaticParams() {
  return [{ locale: "es" }, { locale: "en" }];
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }

  const dictionary = getDictionary(locale);

  return {
    title: {
      default: "Comunicaciones Baseball",
      template: `%s | ${dictionary.about.title}`
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const { settings } = await getSiteData();
  const dictionary = getDictionary(locale);

  return (
    <>
      <SiteHeader locale={locale} nav={dictionary.nav} />
      {children}
      <SiteFooter locale={locale} teamName={settings.teamName} />
    </>
  );
}
