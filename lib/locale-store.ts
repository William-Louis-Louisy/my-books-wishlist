import { DEFAULT_LOCALE, resolveAppLocale, type AppLocale } from "@/lib/i18n";

const STORAGE_KEY = "book-wishlist:locale";
const EVENT_NAME = "book-wishlist:locale-change";

export function getServerLocaleSnapshot(): AppLocale {
  return DEFAULT_LOCALE;
}

export function getLocaleSnapshot(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  return resolveAppLocale(window.localStorage.getItem(STORAGE_KEY) ?? undefined);
}

export function subscribeToLocale(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(EVENT_NAME, onChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(EVENT_NAME, onChange);
  };
}

export function setStoredLocale(locale: AppLocale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, locale);
  window.dispatchEvent(new Event(EVENT_NAME));
}
