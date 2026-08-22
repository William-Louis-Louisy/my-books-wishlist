import { getIntlLocale } from "@/lib/i18n";
import type { ReleaseDatePrecision } from "@/types/book";

export function getTodayIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function getReleaseDatePrecision(
  value: string,
): ReleaseDatePrecision | null {
  if (/^\d{4}$/.test(value)) return Number(value) > 0 ? "year" : null;

  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return year > 0 && month >= 1 && month <= 12 ? "month" : null;
  }

  return isValidIsoDate(value) ? "day" : null;
}

export function isValidReleaseDate(value: string): boolean {
  return getReleaseDatePrecision(value) !== null;
}

export function formatReleaseDate(value: string, locale = "fr"): string {
  const precision = getReleaseDatePrecision(value);
  const intlLocale = getIntlLocale(locale);

  if (precision === "year") return value;

  if (precision === "month") {
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat(intlLocale, {
      month: "short",
      year: "numeric",
    })
      .format(new Date(year, month - 1, 1))
      .replace(".", "")
      .toLocaleUpperCase(intlLocale);
  }

  if (precision === "day") {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat(intlLocale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(date)
      .replace(".", "")
      .toLocaleUpperCase(intlLocale);
  }

  return value;
}

export function formatDateTime(value: string | undefined, locale = "fr", emptyLabel = "Jamais"): string {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatMonthLabel(monthKey: string, locale = "fr"): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toLocaleUpperCase(getIntlLocale(locale)) + label.slice(1);
}
