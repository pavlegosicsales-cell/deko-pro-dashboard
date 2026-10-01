"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Logo } from "@/components/ui";

/*
  Levi meni (desktop), redizajn 01.10.2026. po Promo Bet ERP-u: beo, grupe sa naslovom,
  aktivna stavka crna, crvena značka = koliko leadova čeka poziv. Na telefonu ga nema (donji meni).
*/
export const I = {
  leadovi: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  analitika: <path d="M3 3v18h18M7 15l3-4 3 3 4-6" />,
  ponude: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M9 13h6M9 17h6" /></>,
  kalkulator: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 11h2M12 11h2M8 15h2M12 15h2M16 15v3M8 19h6" /></>,
  ugradnja: <><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /></>,
  kupci: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  odjava: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trazi: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
};

export function Ico({ d, size = 18 }: { d: React.ReactNode; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}

type Stavka = { label: string; href: string; icon: React.ReactNode; badge?: number; tacno?: boolean };

export function Sidebar({ uRedu, onDodaj, login }: { uRedu: number; onDodaj?: () => void; login?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const odjava = async () => { await supabaseBrowser().auth.signOut(); router.replace("/login"); router.refresh(); };

  const grupe: { naslov: string; stavke: Stavka[] }[] = [
    { naslov: "Danas", stavke: [
      { label: "Leadovi", href: "/", icon: I.leadovi, badge: uRedu, tacno: true },
      { label: "Analitika", href: "/analitika", icon: I.analitika },
    ] },
    { naslov: "Prodaja", stavke: [
      { label: "Kalkulator", href: "/kalkulator", icon: I.kalkulator },
      { label: "Ponude i kupci", href: "/ponude", icon: I.kupci },
      { label: "Ponuda za ugradnju", href: "/ugradnja", icon: I.ugradnja },
    ] },
  ];
  const aktivna = (s: Stavka) => (s.tacno ? pathname === s.href : pathname.startsWith(s.href));

  return (
    <aside className="side fixed inset-y-0 left-0 z-20 hidden w-[var(--side-w)] flex-col lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <Logo size={36} />
        <div className="leading-none">
          <div className="nav-wordmark text-[16px]">Deko Pro</div>
          <div className="nav-sub mt-1">Panel</div>
        </div>
      </Link>

      <div className="px-3 pb-1">
        {onDodaj
          ? <button onClick={onDodaj} className="btn btn-sm btn-block"><Ico d={I.plus} size={16} />Novi lead</button>
          : <Link href="/#novi" className="btn btn-sm btn-block"><Ico d={I.plus} size={16} />Novi lead</Link>}
      </div>

      <nav className="flex flex-col">
        {grupe.map((g) => (
          <div key={g.naslov}>
            <div className="side-group">{g.naslov}</div>
            {g.stavke.map((s) => (
              <Link key={s.href} href={s.href} aria-current={aktivna(s) ? "page" : undefined} className="side-link">
                <Ico d={s.icon} />
                {s.label}
                {s.badge != null && s.badge > 0 && <span className="side-badge">{s.badge}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-line px-3 py-3">
        {login && <button onClick={odjava} className="side-link w-[calc(100%-16px)]"><Ico d={I.odjava} />Odjava</button>}
        <div className="px-3 pt-2 text-[11px] text-muted">Deko Pro · 062 253 140</div>
      </div>
    </aside>
  );
}
