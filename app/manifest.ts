import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "My Books Wishlist",
    short_name: "My Books",
    description:
      "Track upcoming, available and purchased books in a private, local-first wishlist.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#3E6259",
    theme_color: "#F7F6F2",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
