import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans, Outfit } from "next/font/google";
import "./globals.css";

// Isti fontovi kao na sajtu: Outfit (display, uppercase), Noto Sans (telo), Inter (h3)
const noto = Noto_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-noto", weight: ["400", "500", "600", "700"] });
const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-outfit", weight: ["500", "600", "700"] });
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Deko Pro — Leadovi",
  description: "Interni panel — Deko Pro (dekorativni blok)",
};

export const viewport: Viewport = { themeColor: "#0B1E3B", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={`${noto.variable} ${outfit.variable} ${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
