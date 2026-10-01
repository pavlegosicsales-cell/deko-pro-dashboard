"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { statusOd } from "@/lib/opcije";

/*
  Globalna pretraga (Ctrl+K), kao u Promo Bet ERP-u: ime, telefon, mesto, broj ponude.
  Traži kroz /api/pretraga (leadovi, dosijei, ponude) i vodi pravo na stranu leada / kupca / ponude.
*/
export type Pogodak = { vrsta: "lead" | "dosije" | "ponuda"; id: string; naslov: string; opis: string; href: string; status?: string | null };

export function Pretraga({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [rez, setRez] = useState<Pogodak[]>([]);
  const [radi, setRadi] = useState(false);
  const [i, setI] = useState(0);
  const inp = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inp.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);

  useEffect(() => {
    const t = setTimeout(async () => {
      setRadi(true);
      try { const r = await fetch(`/api/pretraga?q=${encodeURIComponent(q)}`); const j = await r.json(); setRez(j.pogoci ?? []); setI(0); }
      catch { setRez([]); }
      finally { setRadi(false); }
    }, q ? 150 : 0);
    return () => clearTimeout(t);
  }, [q]);

  const idi = (p: Pogodak) => { onClose(); router.push(p.href); };
  const tast = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(x + 1, rez.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
    if (e.key === "Enter" && rez[i]) idi(rez[i]);
  };
  const ikona = { lead: "L", dosije: "K", ponuda: "P" };
  const boja = { lead: "bg-blue-bg text-blue", dosije: "bg-green-bg text-green", ponuda: "bg-violet-bg text-violet" };

  return (
    <div className="modal-bg fixed inset-0 z-50 flex items-start justify-center px-3 pt-[12vh]" onClick={onClose}>
      <div className="rise w-full max-w-xl overflow-hidden rounded-[14px] border border-line bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-line px-4">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={tast} placeholder="Ime, telefon, mesto, broj ponude…" className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted" />
          <span className="kbd">Esc</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-1">
          {rez.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-muted">{radi ? "Tražim…" : q ? "Nema pogodaka." : "Najskoriji leadovi i kupci."}</p>}
          {rez.map((p, k) => {
            const st = p.status ? statusOd(p.status) : null;
            return (
              <button key={p.vrsta + p.id} type="button" onMouseEnter={() => setI(k)} onClick={() => idi(p)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${k === i ? "bg-wash" : ""}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[12px] font-bold ${boja[p.vrsta]}`}>{ikona[p.vrsta]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">{p.naslov}</span>
                  <span className="block truncate text-[12px] text-muted">{p.opis}</span>
                </span>
                {st && <span className={`tag tag-${st.ton}`}>{st.l}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
