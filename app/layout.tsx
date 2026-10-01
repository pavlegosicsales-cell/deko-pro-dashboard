import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

// Redizajn 01.10.2026.: Inter za ceo radni prostor (kao Promo Bet / Kendo), Outfit samo za logo-wordmark.
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", weight: ["400", "500", "600", "700"] });
const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-outfit", weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Deko Pro — Panel",
  description: "Interni panel — Deko Pro (dekorativni blok)",
};

export const viewport: Viewport = { themeColor: "#FFFFFF", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={`${inter.variable} ${outfit.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
