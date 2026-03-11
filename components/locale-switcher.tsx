"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { locales } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  currentLocale: "es" | "en";
};

export function LocaleSwitcher({ currentLocale }: Props) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const tail = segments.slice(1).join("/");

  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${tail ? `/${tail}` : ""}`}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/60",
            locale === currentLocale && "bg-gold text-ink"
          )}
        >
          {locale}
        </Link>
      ))}
    </div>
  );
}
