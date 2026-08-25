export interface PwaRuntimeSignals {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  displayModeStandalone: boolean;
  navigatorStandalone?: boolean;
}

export interface PwaRuntimeContext {
  isIosLike: boolean;
  isStandalone: boolean;
}

export interface BeforeInstallPromptChoice {
  outcome: "accepted" | "dismissed";
  platform: string;
}

export interface BeforeInstallPromptEventLike extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
}

export const PWA_INSTALL_SNOOZE_KEY =
  "book-wishlist:pwa-install-snoozed-until";
export const PWA_INSTALL_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

export function isIosLikeDevice({
  userAgent,
  platform,
  maxTouchPoints = 0,
}: Pick<PwaRuntimeSignals, "userAgent" | "platform" | "maxTouchPoints">) {
  const classicIos = /iPad|iPhone|iPod/i.test(userAgent);
  const ipadDesktopMode = platform === "MacIntel" && maxTouchPoints > 1;

  return classicIos || ipadDesktopMode;
}

export function resolvePwaRuntimeContext(
  signals: PwaRuntimeSignals,
): PwaRuntimeContext {
  return {
    isIosLike: isIosLikeDevice(signals),
    isStandalone:
      signals.displayModeStandalone || signals.navigatorStandalone === true,
  };
}

export function readPwaRuntimeContext(): PwaRuntimeContext {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { isIosLike: false, isStandalone: false };
  }

  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return resolvePwaRuntimeContext({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    displayModeStandalone: window.matchMedia("(display-mode: standalone)").matches,
    navigatorStandalone: navigatorWithStandalone.standalone,
  });
}

export function shouldOfferPwaInstall(
  snoozedUntil: string | null,
  now = Date.now(),
) {
  if (!snoozedUntil) return true;

  const timestamp = Number(snoozedUntil);
  return !Number.isFinite(timestamp) || timestamp <= now;
}

export function getPwaInstallSnoozedUntil(now = Date.now()) {
  return String(now + PWA_INSTALL_SNOOZE_MS);
}
