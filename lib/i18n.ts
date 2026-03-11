import en from "@/messages/en";
import es from "@/messages/es";

import type { Locale } from "@/lib/types";

export const locales: Locale[] = ["es", "en"];
export const defaultLocale: Locale = "es";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale) {
  return locale === "en" ? en : es;
}

export function localeLabel(locale: Locale) {
  return locale === "en" ? "English" : "Espanol";
}

export function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-GT", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

export function toLocalDateTimeInputValue(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromLocalDateTimeInput(value: string) {
  if (!value) {
    return new Date().toISOString();
  }

  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes, 0).toISOString();
}
