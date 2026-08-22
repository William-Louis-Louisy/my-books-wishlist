export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "book-wishlist:theme";
const EVENT_NAME = "book-wishlist:theme-change";
const DEFAULT_THEME: ThemePreference = "system";

function resolveThemePreference(value?: string | null): ThemePreference {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : DEFAULT_THEME;
}

export function getServerThemeSnapshot(): ThemePreference {
  return DEFAULT_THEME;
}

export function getThemeSnapshot(): ThemePreference {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return resolveThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
}

export function subscribeToTheme(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(EVENT_NAME, onChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(EVENT_NAME, onChange);
  };
}

export function setStoredTheme(theme: ThemePreference): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new Event(EVENT_NAME));
}
