import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Deko Pro — Leadovi",
    short_name: "Deko Pro",
    description: "Interni panel za leadove — Deko Pro",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1E3B",
    theme_color: "#0B1E3B",
    icons: [
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
