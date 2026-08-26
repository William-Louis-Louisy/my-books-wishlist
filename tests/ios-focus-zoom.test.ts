import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { IOS_WEBKIT_FOCUS_ZOOM_GUARD_SCRIPT } from "@/lib/ios-focus-zoom";

interface NavigatorSignals {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

function runViewportGuard(
  initialContent: string,
  navigatorSignals: NavigatorSignals,
) {
  let viewportContent = initialContent;

  const viewportMeta = {
    getAttribute(name: string) {
      return name === "content" ? viewportContent : null;
    },
    setAttribute(name: string, value: string) {
      if (name === "content") viewportContent = value;
    },
  };

  const documentStub = {
    querySelector(selector: string) {
      return selector === 'meta[name="viewport"]' ? viewportMeta : null;
    },
    documentElement: {},
  };

  runInNewContext(IOS_WEBKIT_FOCUS_ZOOM_GUARD_SCRIPT, {
    navigator: navigatorSignals,
    document: documentStub,
  });

  return viewportContent;
}

const baseViewport =
  "width=device-width, initial-scale=1, viewport-fit=cover";

describe("iOS WebKit focus zoom guard", () => {
  it("adds maximum-scale=1 on iPhone Safari/WebKit runtimes", () => {
    expect(
      runViewportGuard(baseViewport, {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Version/18.0 Safari/604.1",
        platform: "iPhone",
        maxTouchPoints: 5,
      }),
    ).toBe(
      "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
    );
  });

  it("covers iPad desktop-mode user agents", () => {
    expect(
      runViewportGuard(baseViewport, {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5,
      }),
    ).toContain("maximum-scale=1");
  });

  it("replaces an existing maximum scale instead of duplicating it", () => {
    expect(
      runViewportGuard(`${baseViewport}, maximum-scale=5`, {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
        platform: "iPhone",
        maxTouchPoints: 5,
      }),
    ).toBe(
      "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
    );
  });

  it("does not constrain non-iOS browsers", () => {
    expect(
      runViewportGuard(baseViewport, {
        userAgent:
          "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",
        platform: "Linux armv8l",
        maxTouchPoints: 5,
      }),
    ).toBe(baseViewport);
  });
});
