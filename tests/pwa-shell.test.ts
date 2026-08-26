import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const serviceWorkerSource = readFileSync(
  fileURLToPath(new URL("../public/sw.js", import.meta.url)),
  "utf8",
);
const globalCssSource = readFileSync(
  fileURLToPath(new URL("../app/globals.css", import.meta.url)),
  "utf8",
);

describe("PWA shell safety", () => {
  it("pre-caches only public application shell routes", () => {
    expect(serviceWorkerSource).toContain(
      'const APP_SHELL = ["/", "/settings", "/book/new", "/manifest.webmanifest"]',
    );
    expect(serviceWorkerSource).toContain('if (request.method !== "GET") return;');
    expect(serviceWorkerSource).toContain(
      "if (url.origin !== self.location.origin) return;",
    );
  });

  it("does not touch application storage while rotating its own caches", () => {
    expect(serviceWorkerSource).not.toMatch(/indexedDB|deleteDatabase|localStorage/);
    expect(serviceWorkerSource).toContain("key.startsWith(CACHE_PREFIX)");
    expect(serviceWorkerSource).toContain("key === LEGACY_CACHE_NAME");
  });

  it("waits for existing sessions before activating an update", () => {
    expect(serviceWorkerSource).toContain("if (!self.registration.active)");
    expect(serviceWorkerSource).toContain("self.skipWaiting()");
  });
});

describe("iOS form focus", () => {
  it("keeps every form control at 16px without device-detection gates", () => {
    expect(globalCssSource).toContain(
      "input,\ntextarea,\nselect {\n  font-size: 16px !important;\n}",
    );
    expect(globalCssSource).not.toContain(
      "@media (hover: none) and (pointer: coarse)",
    );
    expect(globalCssSource).not.toContain("-webkit-touch-callout: none");
  });
});
