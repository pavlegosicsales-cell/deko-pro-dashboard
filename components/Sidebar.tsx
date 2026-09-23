"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { Logo } from "@/components/ui";

// Desktop sidebar kao na Mojsilov dashboardu: fiksan levo, navy, sadržaj ide
// preko cele preostale širine. Na telefonu ga nema (tamo je pill nav).
type Item = { label: string; icon: React.ReactNode; active?: boolean; uskoro?: boolean; badge?: number };

const I = {
  leadovi: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
  analitika: <path d="M3 3v18h18M7 15l3-4 3 3 4-6" />,
  forma: <path d="M4 4h16v16H4zM8 9h8M8 13h5" />,
  podesavanja: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  odjava: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
};

function Ico({ d }: { d: React.ReactNode }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}

export function Sidebar({ uRedu, onDodaj }: { uRedu: number; onDodaj: () => void }) {
  const router = useRouter();
  const odjava = async () => { await supabaseBrowser().auth.signOut(); router.replace("/login"); router.refresh(); };

  const stavke: Item[] = [
    { label: "Leadovi", icon: I.leadovi, active: true, badge: uRedu },
    { label: "Analitika", icon: I.analitika, uskoro: true },
    { label: "Forma sa sajta", icon: I.forma, uskoro: true },
  ];

  return (
    <aside className="blueprint fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-navy text-white lg:flex">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <Logo size={44} />
        <div className="leading-none">
          <div className="nav-wordmark text-[20px]">Deko Pro</div>
          <div className="nav-sub mt-1">Leadovi</div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button onClick={onDodaj} className="btn btn-sm btn-gold btn-block">
          Novi lead
          <span className="btn-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span>
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        <div className="micro px-3 pb-1 pt-2 text-[11px] text-white/45">Rad</div>
        {stavke.map((it) => (
          <button key={it.label} disabled={it.uskoro} title={it.uskoro ? "Uskoro" : undefined}
            className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] font-medium transition-colors ${it.active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"} ${it.uskoro ? "cursor-default opacity-50 hover:bg-transparent hover:text-white/70" : ""}`}>
            <span className={it.active ? "text-gold" : ""}><Ico d={it.icon} /></span>
            {it.label}
            {it.badge != null && it.badge > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-bold text-navy">{it.badge}</span>
            )}
            {it.uskoro && <span className="ml-auto text-[10px] uppercase tracking-wider text-white/40">uskoro</span>}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-white/10 px-3 py-3">
        <button disabled title="Uskoro" className="flex cursor-default items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-white/50">
          <Ico d={I.podesavanja} />Podešavanja
        </button>
        <button onClick={odjava} className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white">
          <Ico d={I.odjava} />Odjava
        </button>
        <div className="px-3 pt-2 text-[11px] text-white/35">062 253 140 · od 2015.</div>
      </div>
    </aside>
  );
}
