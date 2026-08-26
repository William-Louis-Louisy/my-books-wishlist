import manifest from "@/app/manifest";
import { describe, expect, it } from "vitest";

describe("PWA manifest", () => {
  it("keeps a stable app identity and scope", () => {
    const value = manifest();

    expect(value).toMatchObject({
      id: "/",
      name: "My Books Wishlist",
      short_name: "My Books",
      start_url: "/",
      scope: "/",
      display: "standalone",
    });
  });

  it("declares standard and maskable installation icons", () => {
    const icons = manifest().icons ?? [];

    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/icons/icon-192.png",
          sizes: "192x192",
          purpose: "any",
        }),
        expect.objectContaining({
          src: "/icons/icon-512.png",
          sizes: "512x512",
          purpose: "any",
        }),
        expect.objectContaining({
          src: "/icons/icon-maskable-512.png",
          sizes: "512x512",
          purpose: "maskable",
        }),
      ]),
    );
  });
});
