import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Deko Pro — Panel",
    short_name: "Deko Pro",
    description: "Interni panel za leadove — Deko Pro",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F6F8",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
