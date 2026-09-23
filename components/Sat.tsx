"use client";

import { useEffect, useState } from "react";

// Datum i vreme po Beogradu, osvežava se svakog minuta. Renderuje se tek posle
// mount-a da se server i klijent ne razlikuju (hydration).
export function Sat({ className = "" }: { className?: string }) {
  const [t, setT] = useState<string>("");
  useEffect(() => {
    const f = () => {
      const d = new Date();
      const dan = d.toLocaleDateString("sr-Latn-RS", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Belgrade" });
      const sat = d.toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Belgrade" });
      setT(`${dan.charAt(0).toUpperCase()}${dan.slice(1)} · ${sat}`);
    };
    f();
    const id = setInterval(f, 15_000);
    return () => clearInterval(id);
  }, []);
  return <span className={className} suppressHydrationWarning>{t || " "}</span>;
}
