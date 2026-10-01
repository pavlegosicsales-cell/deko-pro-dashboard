"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/*
  Donji meni, samo na telefonu (Pavle radi 60 % sa telefona). Beo, aktivna stavka crna,
  crvena značka = leadovi koji čekaju poziv. Strane ispod ostavljaju donji razmak (pb-24).
*/
const STAVKE = [
  { href: "/", l: "Leadovi", ikona: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></> },
  { href: "/kalkulator", l: "Kalkulator", ikona: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 11h2M12 11h2M8 15h2M12 15h2M16 15v3" /></> },
  { href: "/ponude", l: "Kupci", ikona: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></> },
  { href: "/ugradnja", l: "Ugradnja", ikona: <><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /></> },
  { href: "/analitika", l: "Analitika", ikona: <path d="M3 3v18h18M7 15l3-4 3 3 4-6" /> },
];

export function MobilniMeni({ uRedu }: { uRedu?: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Glavni meni" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto grid max-w-3xl grid-cols-5">
        {STAVKE.map((s) => {
          const aktivna = s.href === "/" ? pathname === "/" || pathname.startsWith("/lead") : pathname.startsWith(s.href);
          return (
            <Link key={s.href} href={s.href} aria-current={aktivna ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 px-1 pb-2 pt-2 text-[10.5px] font-semibold ${aktivna ? "text-ink" : "text-muted"}`}>
              <span className={`grid h-7 w-11 place-items-center rounded-full ${aktivna ? "bg-ink text-white" : ""}`}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{s.ikona}</svg>
              </span>
              {s.l}
              {s.href === "/" && !!uRedu && (
                <span className="absolute right-[calc(50%-24px)] top-1 min-w-[17px] rounded-full bg-red px-1 text-center text-[10px] font-bold leading-[17px] text-white">{uRedu}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
