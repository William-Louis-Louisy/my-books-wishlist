export const APP_LOCALES = ["fr", "en"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "fr";
export const APP_TIME_ZONE = "UTC";
export const LOCALE_COOKIE = "book-wishlist-locale";

export function isAppLocale(value: string | undefined): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale);
}

export function resolveAppLocale(value: string | undefined): AppLocale {
  return isAppLocale(value) ? value : DEFAULT_LOCALE;
}

export function getIntlLocale(locale: string): string {
  return locale === "en" ? "en-GB" : "fr-FR";
}
