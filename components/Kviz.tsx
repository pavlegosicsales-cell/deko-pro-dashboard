"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui";

/*
  Kviz za Luku: stari leadovi iz IG/FB prepiske za koje ne znamo da li ih je zvao.
  Screenshot + dva dugmeta. Odgovori se pamte u telefonu (localStorage), na kraju rezime
  koji jednim tapom šalje Pavlu na WhatsApp. Bez baze, bez logina, link se samo pošalje.
  Isti kalup za /kviz, /kviz2, … (lista + folder slika + ključ za pamćenje).
*/

// Podrazumevana dugmad su zvao / nisam / nije se javio; lead može imati svoja (npr. closeovan / nije).
export type KvizDugme = { v: string; l: string; boja: "ok" | "danger" | "neutralno" };
export type KvizLead = { n: number; ime: string; tel: string; info: string; pitanje?: string; dugmad?: KvizDugme[] };
type Odg = string;
const PODRAZUMEVANA: KvizDugme[] = [
  { v: "zvao", l: "Jesam, zvao sam", boja: "ok" },
  { v: "nisam", l: "Nisam zvao", boja: "danger" },
  { v: "nije_se_javio", l: "Zvao sam, nije se javio", boja: "neutralno" },
];
const OZNAKA: Record<string, string> = { zvao: "Zvao ✅", nisam: "Nisam zvao ❌", nije_se_javio: "Zvao, nije se javio 📵", closeovan: "Closeovan ✅", nije_closeovan: "Nije closeovan ❌" };
const oznaka = (v: string | undefined) => (v ? OZNAKA[v] ?? v : "—");

export function Kviz({ leadovi, folder, kljuc, naslov }: { leadovi: readonly KvizLead[]; folder: string; kljuc: string; naslov: string }) {
  const [i, setI] = useState(0);
  const [odg, setOdg] = useState<Record<number, Odg>>({});
  const [gotovo, setGotovo] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(kljuc);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (s) { const o = JSON.parse(s); setOdg(o); const prvi = leadovi.findIndex((l) => !o[l.n]); if (prvi === -1) setGotovo(true); else setI(prvi); }
    } catch { /* prazno */ }
  }, [kljuc, leadovi]);

  const odgovori = (o: Odg) => {
    const novo = { ...odg, [leadovi[i].n]: o };
    setOdg(novo);
    try { localStorage.setItem(kljuc, JSON.stringify(novo)); } catch { /* prazno */ }
    if (i + 1 < leadovi.length) setI(i + 1); else setGotovo(true);
  };

  const rezime = [`Luka, ${naslov}:`, ...leadovi.map((l) => `${l.n}. ${l.ime}${l.tel ? ` (${l.tel})` : ""}: ${oznaka(odg[l.n])}`)].join("\n");
  const wa = `https://wa.me/?text=${encodeURIComponent(rezime)}`;
  const l = leadovi[i];

  return (
    <div className="min-h-screen bg-wash">
      <header className="blueprint bg-navy px-4 pb-4 pt-5 text-white">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <Logo size={40} />
          <div className="leading-none">
            <div className="nav-wordmark">Deko Pro</div>
            <div className="nav-sub mt-1">Kviz: da li si ih zvao?</div>
          </div>
          {!gotovo && <div className="ml-auto text-sm text-white/70">{i + 1} / {leadovi.length}</div>}
        </div>
        <div className="mx-auto mt-3 flex w-full max-w-lg gap-1">
          {leadovi.map((x, k) => (
            <button key={x.n} type="button" onClick={() => { setGotovo(false); setI(k); }} aria-label={`Lead ${x.n}`}
              className={`h-1.5 flex-1 rounded-full ${odg[x.n] ? "bg-gold" : k === i && !gotovo ? "bg-white" : "bg-white/25"}`} />
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 py-4">
        {!gotovo ? (
          <>
            <div className="card overflow-hidden">
              <div className="flex items-baseline justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="h3 truncate text-[16px]">{l.ime}</div>
                  <div className="text-sm text-muted">{l.tel ? `${l.tel} · ` : ""}{l.info}</div>
                </div>
                {l.tel && <a href={`tel:${l.tel.replace(/\s/g, "")}`} className="tag tag-navy shrink-0">Pozovi</a>}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/${folder}/${l.n}.jpg`} alt={`Prepiska: ${l.ime}`} className="max-h-[52vh] w-full bg-black object-contain object-top" />
            </div>

            <p className="mt-4 text-center text-sm text-muted">{l.pitanje ?? "Da li si zvao ovog čoveka?"}</p>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              {(l.dugmad ?? PODRAZUMEVANA).filter((d) => d.boja !== "neutralno").map((d) => (
                <button key={d.v} type="button" onClick={() => odgovori(d.v)} className={`rounded-[10px] px-4 py-4 text-[15px] font-semibold text-white active:scale-[.98] ${d.boja === "ok" ? "bg-ok" : "bg-danger"}`}>{d.l}</button>
              ))}
            </div>
            {(l.dugmad ?? PODRAZUMEVANA).filter((d) => d.boja === "neutralno").map((d) => (
              <button key={d.v} type="button" onClick={() => odgovori(d.v)} className="mt-2.5 w-full rounded-[10px] border border-line bg-white px-4 py-3 text-sm font-medium text-ink">{d.l}</button>
            ))}
            {i > 0 && <button type="button" onClick={() => setI(i - 1)} className="mt-3 w-full text-center text-sm text-muted underline-offset-4 hover:underline">Nazad</button>}
          </>
        ) : (
          <div className="card p-5">
            <h1 className="h-display text-[22px]">Gotovo, hvala!</h1>
            <p className="mt-1 text-sm text-muted">Pošalji Pavlu rezime jednim tapom. Tap na ime menja odgovor.</p>
            <ol className="mt-4 space-y-2">
              {leadovi.map((x, k) => (
                <li key={x.n}>
                  <button type="button" onClick={() => { setGotovo(false); setI(k); }} className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-line px-3 py-2.5 text-left text-sm">
                    <span className="min-w-0"><b className="text-ink">{x.n}. {x.ime}</b><br /><span className="text-muted">{x.tel || x.info}</span></span>
                    <span className="shrink-0 text-[13px] font-semibold">{oznaka(odg[x.n])}</span>
                  </button>
                </li>
              ))}
            </ol>
            <a href={wa} target="_blank" rel="noreferrer" className="btn btn-block mt-5" style={{ background: "#25D366" }}>
              Pošalji Pavlu na WhatsApp
              <span className="btn-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
            </a>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(rezime); }} className="mt-2 w-full text-center text-sm text-muted underline-offset-4 hover:underline">ili kopiraj tekst</button>
          </div>
        )}
      </main>
    </div>
  );
}
