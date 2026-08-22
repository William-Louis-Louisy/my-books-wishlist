import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Book Wishlist",
    short_name: "MBW",
    description: "Track upcoming, available and purchased books.",
    start_url: "/",
    display: "standalone",
    background_color: "#3e6259",
    theme_color: "#F7F6F2",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
