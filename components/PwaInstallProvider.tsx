"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readPwaRuntimeContext,
  type BeforeInstallPromptChoice,
  type BeforeInstallPromptEventLike,
} from "@/lib/pwa-install";

interface PwaInstallContextValue {
  ready: boolean;
  isIosLike: boolean;
  isStandalone: boolean;
  canPromptInstall: boolean;
  requestInstall: () => Promise<BeforeInstallPromptChoice["outcome"] | null>;
}

const PwaInstallContext = createContext<PwaInstallContextValue | undefined>(
  undefined,
);

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isIosLike, setIsIosLike] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEventLike>();

  useEffect(() => {
    const syncRuntime = () => {
      const runtime = readPwaRuntimeContext();
      setIsIosLike(runtime.isIosLike);
      setIsStandalone(runtime.isStandalone);
      setReady(true);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEventLike);
    };

    const handleInstalled = () => {
      setDeferredPrompt(undefined);
      syncRuntime();
    };

    syncRuntime();

    const displayMode = window.matchMedia("(display-mode: standalone)");
    displayMode.addEventListener("change", syncRuntime);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      displayMode.removeEventListener("change", syncRuntime);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      ready,
      isIosLike,
      isStandalone,
      canPromptInstall: Boolean(deferredPrompt),
      requestInstall: async () => {
        if (!deferredPrompt) return null;

        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(undefined);
        return choice.outcome;
      },
    }),
    [deferredPrompt, isIosLike, isStandalone, ready],
  );

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }

  return context;
}
