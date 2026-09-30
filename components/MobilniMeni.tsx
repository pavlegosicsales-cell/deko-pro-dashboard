"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/*
  Meni na dnu ekrana, samo na telefonu (na kompu je sidebar). Pavle dashboard koristi 60 % na telefonu,
  pa mora da se prelazi između Leadova, Kalkulatora, Ponuda i Analitike jednim tapom, sa bilo koje strane.
  Strane ispod dobijaju donji razmak (pb) da meni ne pokrije sadržaj.
*/
const STAVKE = [
  { href: "/", l: "Leadovi", ikona: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></> },
  { href: "/kalkulator", l: "Kalkulator", ikona: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 11h2M12 11h2M8 15h2M12 15h2M16 15v3" /></> },
  { href: "/ponude", l: "Ponude", ikona: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M9 13h6M9 17h6" /></> },
  { href: "/analitika", l: "Analitika", ikona: <path d="M3 3v18h18M7 15l3-4 3 3 4-6" /> },
];

export function MobilniMeni({ uRedu }: { uRedu?: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Glavni meni" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto grid max-w-3xl grid-cols-4">
        {STAVKE.map((s) => {
          const aktivna = s.href === "/" ? pathname === "/" : pathname.startsWith(s.href);
          return (
            <Link key={s.href} href={s.href} aria-current={aktivna ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] font-semibold ${aktivna ? "text-gold" : "text-white/65"}`}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{s.ikona}</svg>
              {s.l}
              {s.href === "/" && !!uRedu && (
                <span className="absolute right-[calc(50%-22px)] top-1.5 min-w-[18px] rounded-full bg-gold px-1 text-center text-[10px] font-bold leading-[18px] text-navy">{uRedu}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
