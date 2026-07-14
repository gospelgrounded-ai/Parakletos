import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Parakletos — Bible Study",
    short_name: "Parakletos",
    description:
      "A Bible study app with multiple translations, highlights, notes, and deep study tools.",
    start_url: "/home",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4051b5",
    icons: [
      { src: "/pwa-icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/pwa-icon-maskable-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa-icon-maskable-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Read the Bible", url: "/bible" },
      { name: "Prayer Journal", url: "/prayer" },
      { name: "Memorize", url: "/memorize" },
    ],
  };
}
