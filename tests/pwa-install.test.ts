import {
  getPwaInstallSnoozedUntil,
  PWA_INSTALL_SNOOZE_MS,
  resolvePwaRuntimeContext,
  shouldOfferPwaInstall,
} from "@/lib/pwa-install";
import { describe, expect, it } from "vitest";

describe("PWA install runtime detection", () => {
  it("detects a classic iPhone browser session", () => {
    expect(
      resolvePwaRuntimeContext({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
        platform: "iPhone",
        maxTouchPoints: 5,
        displayModeStandalone: false,
      }),
    ).toEqual({ isIosLike: true, isStandalone: false });
  });

  it("detects iPadOS when it exposes a desktop Mac platform", () => {
    expect(
      resolvePwaRuntimeContext({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5,
        displayModeStandalone: false,
      }),
    ).toEqual({ isIosLike: true, isStandalone: false });
  });

  it("does not confuse a regular Mac browser with iPadOS", () => {
    expect(
      resolvePwaRuntimeContext({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 0,
        displayModeStandalone: false,
      }),
    ).toEqual({ isIosLike: false, isStandalone: false });
  });

  it("detects installed mode from display-mode standalone", () => {
    expect(
      resolvePwaRuntimeContext({
        userAgent: "Chromium",
        platform: "Linux armv8l",
        maxTouchPoints: 5,
        displayModeStandalone: true,
      }).isStandalone,
    ).toBe(true);
  });

  it("detects installed mode from the iOS navigator standalone flag", () => {
    expect(
      resolvePwaRuntimeContext({
        userAgent: "iPhone",
        platform: "iPhone",
        maxTouchPoints: 5,
        displayModeStandalone: false,
        navigatorStandalone: true,
      }).isStandalone,
    ).toBe(true);
  });
});

describe("PWA install snooze", () => {
  it("offers installation when no snooze exists", () => {
    expect(shouldOfferPwaInstall(null, 1_000)).toBe(true);
  });

  it("keeps the prompt hidden until the snooze expires", () => {
    expect(shouldOfferPwaInstall("2000", 1_000)).toBe(false);
    expect(shouldOfferPwaInstall("2000", 2_000)).toBe(true);
  });

  it("recovers from an invalid stored value", () => {
    expect(shouldOfferPwaInstall("invalid", 1_000)).toBe(true);
  });

  it("snoozes for the configured duration", () => {
    expect(getPwaInstallSnoozedUntil(1_000)).toBe(
      String(1_000 + PWA_INSTALL_SNOOZE_MS),
    );
  });
});
