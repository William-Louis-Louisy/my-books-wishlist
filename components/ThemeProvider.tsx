"use client";

import {
  getThemeSnapshot,
  subscribeToTheme,
  getServerThemeSnapshot,
  type ThemePreference,
} from "@/lib/theme-store";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

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
