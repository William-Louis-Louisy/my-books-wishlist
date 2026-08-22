"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeToTheme,
  type ThemePreference,
} from "@/lib/theme-store";

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemePreference();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return children;
}
